const { activeAxes, coordinateToBlockAndThread, coordinateToLinear, cudaCode, formatTuple, isInBounds, product } = CudaMapping;

const MAX_AXIS_VALUE = 1024;
const MAX_BLOCK_THREADS = 1024;
const MAX_RENDERED_BLOCKS = 64;
const MAX_RENDERED_CELLS = 1024;
const MAX_VISUAL_BLOCK_COLUMNS = 8;
const ZOOM_LEVELS = [0.6, 0.8, 1, 1.2];

const state = {
  dimensions: 2,
  shape: { x: 12, y: 8, z: 4 },
  blockDim: { x: 4, y: 2, z: 2 },
  gridDim: { x: 3, y: 4, z: 2 },
  selected: { x: 6, y: 3, z: 0 },
  slice: 0,
  zoomIndex: 2,
  focusedBlock: null,
};

const map = document.querySelector('#map');
const arrayInputs = document.querySelector('#array-inputs');
const blockInputs = document.querySelector('#block-inputs');
const gridInputs = document.querySelector('#grid-inputs');
const summary = document.querySelector('#summary');
const details = document.querySelector('#selected-details');
const codeExample = document.querySelector('#code-example');
const sliceStack = document.querySelector('#slice-stack');
const unassigned = document.querySelector('#unassigned');
const coverageStatement = document.querySelector('#coverage-statement');
const dimensionNote = document.querySelector('#dimension-note');
const blockLimitNote = document.querySelector('#block-limit-note');
const renderNote = document.querySelector('#render-note');
const mapZoom = document.querySelector('#map-zoom');
const zoomOut = document.querySelector('#zoom-out');
const zoomIn = document.querySelector('#zoom-in');
const zoomLevel = document.querySelector('#zoom-level');
const blockNavigator = document.querySelector('#block-navigator');
const blockViewLabel = document.querySelector('#block-view-label');
const showAllBlocks = document.querySelector('#show-all-blocks');

function axes() { return activeAxes(state.dimensions); }
function clamp(value, max = 32) { return Math.max(1, Math.min(max, Number(value) || 1)); }
function axisMax(key, axis) { return key === 'blockDim' ? (axis === 'z' ? 64 : MAX_AXIS_VALUE) : 32; }
function inputGroup(target, label, values, key) {
  target.replaceChildren();
  axes().forEach((axis) => {
    const inputLabel = document.createElement('label');
    inputLabel.textContent = `${label}${axis}`;
    const input = document.createElement('input');
    input.type = 'number'; input.id = `${key}-${axis}`; input.name = `${key}-${axis}`; input.min = '1'; input.max = String(axisMax(key, axis)); input.value = values[axis]; input.dataset.key = key; input.dataset.axis = axis;
    inputLabel.htmlFor = input.id;
    inputLabel.append(input); target.append(inputLabel);
  });
}

function inLaunchedGrid(coordinate) {
  return axes().every((axis) => coordinate[axis] < state.blockDim[axis] * state.gridDim[axis]);
}

function updateInputs() {
  inputGroup(arrayInputs, 'N', state.shape, 'shape');
  inputGroup(blockInputs, 'T', state.blockDim, 'blockDim');
  inputGroup(gridInputs, 'B', state.gridDim, 'gridDim');
  document.querySelectorAll('#dimension-picker button').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.dimensions) === state.dimensions)));
  blockLimitNote.textContent = `CUDA model: up to ${MAX_BLOCK_THREADS} active threads per block (product of the visible T axes).`;
  const sliceDepth = Math.max(state.blockDim.z * state.gridDim.z, state.shape.z);
  state.slice = Math.min(state.slice, sliceDepth - 1);
}

function renderSummary() {
  const currentAxes = axes();
  const totalThreads = product(state.blockDim, currentAxes) * product(state.gridDim, currentAxes);
  const dataElements = product(state.shape, currentAxes);
  const launchedShape = Object.fromEntries(currentAxes.map((axis) => [axis, state.blockDim[axis] * state.gridDim[axis]]));
  const coveredElements = currentAxes.reduce((total, axis) => total * Math.min(state.shape[axis], launchedShape[axis]), 1);
  const unassignedElements = dataElements - coveredElements;
  const unusedThreads = totalThreads - coveredElements;
  const overlapShape = Object.fromEntries(currentAxes.map((axis) => [axis, Math.min(state.shape[axis], launchedShape[axis])]));
  summary.innerHTML = `<div class="data-total"><span>Data elements</span><strong>${dataElements}</strong></div><div class="launch-total"><span>Launched threads</span><strong>${totalThreads}</strong></div><div class="covered-total"><span>Covered data</span><strong>${coveredElements}</strong></div><div class="${unusedThreads ? 'warning' : ''}"><span>Unused threads</span><strong>${unusedThreads}</strong></div><div class="${unassignedElements ? 'warning' : ''}"><span>Uncovered data</span><strong>${unassignedElements}</strong></div><div><span>Launch shape</span><strong>${formatTuple(launchedShape, currentAxes)}</strong></div>`;
  coverageStatement.innerHTML = `<strong>Array shape N</strong> ${formatTuple(state.shape, currentAxes)} <span>∩</span> <strong>launch shape</strong> ${formatTuple(launchedShape, currentAxes)} <span>=</span> <strong>covered shape</strong> ${formatTuple(overlapShape, currentAxes)}`;
}

function visibleSlices(total, selected) {
  if (total <= 8) return Array.from({ length: total }, (_, z) => z);
  return [...new Set([0, 1, selected - 1, selected, selected + 1, total - 2, total - 1].filter((z) => z >= 0 && z < total))];
}

function renderSliceStack() {
  sliceStack.replaceChildren();
  if (state.dimensions < 3) { sliceStack.hidden = true; return; }
  sliceStack.hidden = false;
  const total = state.blockDim.z * state.gridDim.z;
  const layers = visibleSlices(total, state.slice);
  const title = document.createElement('p');
  title.className = 'stack-label';
  title.textContent = `Viewing the x–y plane at z = ${state.slice}; layers are grouped by blockIdx.z.`;
  const layersElement = document.createElement('div');
  layersElement.className = 'stack-groups';
  let previous = -1;
  const groups = new Map();
  layers.forEach((z) => {
    const blockZ = Math.floor(z / state.blockDim.z);
    if (!groups.has(blockZ)) groups.set(blockZ, []);
    groups.get(blockZ).push(z);
  });
  [...groups.entries()].forEach(([blockZ, slices]) => {
    const firstSlice = slices[0];
    if (firstSlice > previous + 1) {
      const ellipsis = document.createElement('span'); ellipsis.className = 'stack-ellipsis'; ellipsis.textContent = '⋮'; layersElement.append(ellipsis);
    }
    const group = document.createElement('section'); group.className = 'slice-group';
    const groupLabel = document.createElement('p'); groupLabel.className = 'slice-group-label'; groupLabel.textContent = `blockIdx.z = ${blockZ}`;
    const groupLayers = document.createElement('div'); groupLayers.className = 'stack-layers';
    slices.forEach((z) => {
      const isCurrent = z === state.slice;
      const inBounds = z < state.shape.z;
      const layer = document.createElement('button');
      layer.type = 'button'; layer.className = `slice-layer${isCurrent ? ' current' : ''}${inBounds ? '' : ' outside'}`;
      layer.dataset.z = z;
      layer.innerHTML = `<span>z = ${z}</span><small>threadIdx.z = ${z % state.blockDim.z}</small>${inBounds ? '' : '<em>outside N</em>'}`;
      layer.setAttribute('aria-pressed', String(isCurrent));
      layer.setAttribute('aria-label', `z equals ${z}; block index z equals ${blockZ}; thread index z equals ${z % state.blockDim.z}${inBounds ? '' : '; outside N'}`);
      layer.addEventListener('click', () => { state.slice = z; state.selected.z = z; render(); });
      groupLayers.append(layer); previous = z;
    });
    group.append(groupLabel, groupLayers); layersElement.append(group);
  });
  sliceStack.append(title, layersElement);
}

function cellLabel(coordinate) {
  return state.dimensions === 1 ? String(coordinate.x) : `${coordinate.x},${coordinate.y}`;
}

function blockColor(blockIndex) {
  // Color is a stable anchor for x-y tile position. In 3D, the slice stack
  // shows blockIdx.z structurally, so colors do not jump between layers.
  return `hsl(${(blockIndex.x * 47 + blockIndex.y * 91) % 360} 65% 42%)`;
}

function renderDimensionNote() {
  dimensionNote.hidden = false;
  dimensionNote.textContent = state.dimensions === 3
    ? '3D reading: tile color identifies the x–y block position; stack groups identify blockIdx.z; each layer shows threadIdx.z.'
    : 'Block color identifies the CUDA block that contains each thread.';
}

function renderZoom(compactLayout) {
  mapZoom.hidden = !compactLayout;
  if (!compactLayout) return;
  const percentage = Math.round(ZOOM_LEVELS[state.zoomIndex] * 100);
  zoomLevel.value = `${percentage}%`;
  zoomLevel.textContent = `${percentage}%`;
  zoomOut.disabled = state.zoomIndex === 0;
  zoomIn.disabled = state.zoomIndex === ZOOM_LEVELS.length - 1;
}

function sampleIndices(total, limit, selectedIndex) {
  if (total <= limit) return Array.from({ length: total }, (_, index) => index);
  const indices = new Set(Array.from({ length: limit }, (_, index) => Math.round(index * (total - 1) / (limit - 1))));
  if (selectedIndex >= 0 && selectedIndex < total && !indices.has(selectedIndex)) {
    indices.delete([...indices][Math.floor(indices.size / 2)]);
    indices.add(selectedIndex);
  }
  return [...indices].sort((left, right) => left - right);
}

function sampledBlocks() {
  const total = state.gridDim.x * (state.dimensions === 1 ? 1 : state.gridDim.y);
  const selectedBlockX = Math.floor(state.selected.x / state.blockDim.x);
  const selectedBlockY = state.dimensions === 1 ? 0 : Math.floor(state.selected.y / state.blockDim.y);
  const selectedIndex = selectedBlockY * state.gridDim.x + selectedBlockX;
  return sampleIndices(total, MAX_RENDERED_BLOCKS, selectedIndex).map((index) => ({
    x: index % state.gridDim.x,
    y: Math.floor(index / state.gridDim.x),
  }));
}

function totalBlocks() { return state.gridDim.x * (state.dimensions === 1 ? 1 : state.gridDim.y); }

function focusedBlockIsValid() {
  return state.focusedBlock
    && state.focusedBlock.x < state.gridDim.x
    && (state.dimensions === 1 || state.focusedBlock.y < state.gridDim.y);
}

function focusBlock(block) {
  state.focusedBlock = { x: block.x, y: block.y };
  state.selected = {
    x: block.x * state.blockDim.x,
    y: state.dimensions === 1 ? 0 : block.y * state.blockDim.y,
    z: state.dimensions === 3 ? state.slice : 0,
  };
  render();
}

function renderBlockNavigator(focused, currentAxes) {
  blockNavigator.hidden = totalBlocks() <= 1;
  if (blockNavigator.hidden) return;
  const blockCount = totalBlocks();
  blockViewLabel.textContent = focused
    ? `Focused: blockIdx ${formatTuple(state.focusedBlock, currentAxes)} · ${state.blockDim.x * (state.dimensions === 1 ? 1 : state.blockDim.y)} threads`
    : `Overview: ${blockCount} blocks · select a block header to inspect its threads`;
  showAllBlocks.hidden = !focused;
}

function renderMap() {
  map.replaceChildren();
  const currentAxes = axes();
  const launchedDepth = state.blockDim.z * state.gridDim.z;
  if (state.focusedBlock && !focusedBlockIsValid()) state.focusedBlock = null;
  const focused = Boolean(state.focusedBlock);
  const blocks = focused ? [state.focusedBlock] : sampledBlocks();
  const threadsPerBlock = state.blockDim.x * (state.dimensions === 1 ? 1 : state.blockDim.y);
  const cellsPerBlock = Math.max(1, Math.floor(MAX_RENDERED_CELLS / blocks.length));
  const renderedThreadsPerBlock = Math.min(threadsPerBlock, cellsPerBlock);
  map.style.setProperty('--block-columns', focused ? 1 : Math.min(state.gridDim.x, MAX_VISUAL_BLOCK_COLUMNS));
  map.classList.toggle('one-dimensional', state.dimensions === 1);
  const compactLayout = threadsPerBlock > 32 || blocks.length < totalBlocks();
  map.classList.toggle('compact', compactLayout);
  map.classList.toggle('zoomable', compactLayout);
  map.classList.toggle('focused', focused);
  map.style.setProperty('--zoom-cell-size', `${20 * ZOOM_LEVELS[state.zoomIndex]}px`);
  renderZoom(compactLayout);
  const omittedBlocks = totalBlocks() - blocks.length;
  const omittedThreads = threadsPerBlock - renderedThreadsPerBlock;
  renderNote.hidden = !compactLayout;
  const samplingNote = omittedBlocks || omittedThreads
    ? `${blocks.length} of ${totalBlocks()} blocks and ${renderedThreadsPerBlock} of ${threadsPerBlock} threads per visible block are shown. The selected thread is kept visible when it belongs to this slice.`
    : `All ${threadsPerBlock} threads per block are shown.`;
  renderNote.textContent = `Compact explorer view: ${samplingNote} Large blocks wrap at 16 cells per row; each cell label preserves its CUDA coordinate.`;
  renderBlockNavigator(focused, currentAxes);
  if (state.dimensions === 3 && state.slice >= launchedDepth) {
    const empty = document.createElement('p');
    empty.className = 'empty-launch'; empty.textContent = `No CUDA blocks were launched for z = ${state.slice}.`;
    map.append(empty); return;
  }
  blocks.forEach(({ x: bx, y: by }) => {
      const blockIndex = { x: bx, y: by, z: state.dimensions === 3 ? Math.floor(state.slice / state.blockDim.z) : 0 };
      const region = document.createElement('section');
      region.className = 'block-region';
      region.style.setProperty('--block-color', blockColor(blockIndex));
      region.style.setProperty('--thread-columns', Math.min(state.blockDim.x, 16));
      region.setAttribute('aria-label', `CUDA block ${formatTuple(blockIndex, currentAxes)}`);
      const label = document.createElement('button');
      label.type = 'button'; label.className = 'block-label'; label.textContent = `blockIdx ${formatTuple(blockIndex, currentAxes)}${omittedThreads ? ` · ${renderedThreadsPerBlock}/${threadsPerBlock} threads` : ''}`;
      label.title = focused ? 'This block is in focus' : `Focus block ${formatTuple(blockIndex, currentAxes)}`;
      label.disabled = focused;
      label.addEventListener('click', () => focusBlock({ x: bx, y: by }));
      region.append(label);
      const selectedThreadX = state.selected.x - bx * state.blockDim.x;
      const selectedThreadY = state.dimensions === 1 ? 0 : state.selected.y - by * state.blockDim.y;
      const selectedThreadIndex = selectedThreadX >= 0 && selectedThreadX < state.blockDim.x && selectedThreadY >= 0 && selectedThreadY < state.blockDim.y
        ? selectedThreadY * state.blockDim.x + selectedThreadX : -1;
      sampleIndices(threadsPerBlock, renderedThreadsPerBlock, selectedThreadIndex).forEach((thread) => {
          const tx = thread % state.blockDim.x;
          const ty = Math.floor(thread / state.blockDim.x);
          const coordinate = { x: bx * state.blockDim.x + tx, y: by * state.blockDim.y + ty, z: state.dimensions === 3 ? state.slice : 0 };
          const threadIndex = { x: tx, y: ty, z: state.dimensions === 3 ? coordinate.z % state.blockDim.z : 0 };
          const valid = isInBounds(coordinate, state.shape, currentAxes);
          const chosen = currentAxes.every((axis) => coordinate[axis] === state.selected[axis]);
          const button = document.createElement('button');
          button.type = 'button'; button.className = `cell${valid ? '' : ' outside'}${chosen ? ' selected' : ''}`;
          button.textContent = cellLabel(coordinate);
          button.title = `blockIdx ${formatTuple(blockIndex, currentAxes)}, threadIdx ${formatTuple(threadIndex, currentAxes)}`;
          button.setAttribute('aria-label', `data coordinate ${formatTuple(coordinate, currentAxes)}`);
          button.addEventListener('click', () => { state.selected = coordinate; render(); });
          region.append(button);
      });
      map.append(region);
  });
}

function renderUnassigned() {
  const currentAxes = axes();
  const zValues = state.dimensions === 3 ? [state.slice] : [0];
  const missing = [];
  zValues.forEach((z) => {
    if (state.dimensions === 3 && z >= state.shape.z) return;
    const maxY = state.dimensions === 1 ? 1 : state.shape.y;
    for (let y = 0; y < maxY; y += 1) {
      for (let x = 0; x < state.shape.x; x += 1) {
        const coordinate = { x, y, z };
        if (!inLaunchedGrid(coordinate)) missing.push(coordinate);
      }
    }
  });
  unassigned.replaceChildren();
  if (!missing.length) { unassigned.hidden = true; return; }
  unassigned.hidden = false;
  const title = document.createElement('p');
  title.className = 'unassigned-title';
  title.textContent = `Undercoverage: ${missing.length} data element${missing.length === 1 ? '' : 's'} in this view have no launched thread`;
  const detail = document.createElement('p');
  detail.className = 'unassigned-detail';
  detail.textContent = 'Increase gridDim, blockDim, or use a grid-stride loop to cover them.';
  const cells = document.createElement('div');
  cells.className = 'unassigned-cells'; cells.style.setProperty('--unassigned-columns', Math.min(state.shape.x, 16));
  const shown = missing.slice(0, 160);
  shown.forEach((coordinate) => {
    const cell = document.createElement('span');
    cell.textContent = formatTuple(coordinate, currentAxes);
    cell.title = `No launched thread maps to data coordinate ${formatTuple(coordinate, currentAxes)}`;
    cells.append(cell);
  });
  if (missing.length > shown.length) {
    const more = document.createElement('span'); more.className = 'more-missing'; more.textContent = `+${missing.length - shown.length} more`; cells.append(more);
  }
  unassigned.append(title, detail, cells);
}

function renderDetails() {
  const currentAxes = axes();
  const { blockIndex, threadIndex } = coordinateToBlockAndThread(state.selected, state.blockDim, currentAxes);
  const linear = coordinateToLinear(state.selected, state.shape, currentAxes);
  const inBounds = isInBounds(state.selected, state.shape, currentAxes);
  const launched = inLaunchedGrid(state.selected);
  details.innerHTML = `<dl><div><dt>Data coordinate</dt><dd>${formatTuple(state.selected, currentAxes)}</dd></div><div><dt>blockIdx</dt><dd>${formatTuple(blockIndex, currentAxes)}</dd></div><div><dt>threadIdx</dt><dd>${formatTuple(threadIndex, currentAxes)}</dd></div><div><dt>Linear index</dt><dd>${linear}</dd></div><div><dt>State</dt><dd class="${inBounds && launched ? 'in-bounds' : 'out-of-bounds'}">${inBounds && launched ? 'in bounds: writes data' : 'outside N: guard skips work'}</dd></div></dl>`;
  codeExample.textContent = cudaCode(state.dimensions, state.blockDim, state.gridDim, state.shape);
}

function render() { updateInputs(); renderSummary(); renderSliceStack(); renderDimensionNote(); renderMap(); renderUnassigned(); renderDetails(); }

document.querySelector('#dimension-picker').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-dimensions]');
  if (!button) return;
  state.dimensions = Number(button.dataset.dimensions); state.selected = { x: 0, y: 0, z: 0 }; state.slice = 0; state.focusedBlock = null; render();
});

document.querySelector('.controls').addEventListener('input', (event) => {
  const input = event.target;
  if (!input.dataset.key) return;
  const { key, axis } = input.dataset;
  const nextValue = clamp(input.value, axisMax(key, axis));
  if (key === 'blockDim') {
    const otherAxes = axes().filter((currentAxis) => currentAxis !== axis);
    const otherThreads = otherAxes.reduce((total, currentAxis) => total * state.blockDim[currentAxis], 1);
    state.blockDim[axis] = Math.min(nextValue, Math.max(1, Math.floor(MAX_BLOCK_THREADS / otherThreads)));
  } else {
    state[key][axis] = nextValue;
  }
  if (input.dataset.key === 'shape') state.selected[input.dataset.axis] = Math.min(state.selected[input.dataset.axis], state.shape[input.dataset.axis] - 1);
  render();
});

zoomOut.addEventListener('click', () => {
  state.zoomIndex = Math.max(0, state.zoomIndex - 1);
  render();
});

zoomIn.addEventListener('click', () => {
  state.zoomIndex = Math.min(ZOOM_LEVELS.length - 1, state.zoomIndex + 1);
  render();
});

showAllBlocks.addEventListener('click', () => {
  state.focusedBlock = null;
  render();
});

render();
