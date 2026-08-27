const { activeAxes, coordinateToBlockAndThread, coordinateToLinear, cudaCode, formatTuple, isInBounds, product } = CudaMapping;

const state = {
  dimensions: 2,
  shape: { x: 12, y: 8, z: 4 },
  blockDim: { x: 4, y: 2, z: 2 },
  gridDim: { x: 3, y: 4, z: 2 },
  selected: { x: 6, y: 3, z: 0 },
  slice: 0,
};

const map = document.querySelector('#map');
const arrayInputs = document.querySelector('#array-inputs');
const blockInputs = document.querySelector('#block-inputs');
const gridInputs = document.querySelector('#grid-inputs');
const summary = document.querySelector('#summary');
const details = document.querySelector('#selected-details');
const codeExample = document.querySelector('#code-example');
const sliceControl = document.querySelector('#slice-control');
const sliceInput = document.querySelector('#z-slice');
const sliceOutput = document.querySelector('#z-output');
const sliceStack = document.querySelector('#slice-stack');
const unassigned = document.querySelector('#unassigned');

function axes() { return activeAxes(state.dimensions); }
function clamp(value) { return Math.max(1, Math.min(32, Number(value) || 1)); }
function inputGroup(target, label, values, key) {
  target.replaceChildren();
  axes().forEach((axis) => {
    const inputLabel = document.createElement('label');
    inputLabel.textContent = `${label}${axis}`;
    const input = document.createElement('input');
    input.type = 'number'; input.id = `${key}-${axis}`; input.name = `${key}-${axis}`; input.min = '1'; input.max = '32'; input.value = values[axis]; input.dataset.key = key; input.dataset.axis = axis;
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
  sliceControl.hidden = state.dimensions < 3;
  const sliceDepth = Math.max(state.blockDim.z * state.gridDim.z, state.shape.z);
  sliceInput.max = String(Math.max(0, sliceDepth - 1));
  state.slice = Math.min(state.slice, Number(sliceInput.max)); sliceInput.value = String(state.slice); sliceOutput.textContent = String(state.slice);
}

function renderSummary() {
  const currentAxes = axes();
  const totalThreads = product(state.blockDim, currentAxes) * product(state.gridDim, currentAxes);
  const dataElements = product(state.shape, currentAxes);
  const launchedShape = Object.fromEntries(currentAxes.map((axis) => [axis, state.blockDim[axis] * state.gridDim[axis]]));
  const coveredElements = currentAxes.reduce((total, axis) => total * Math.min(state.shape[axis], launchedShape[axis]), 1);
  const unassignedElements = dataElements - coveredElements;
  summary.innerHTML = `<div><span>Data elements</span><strong>${dataElements}</strong></div><div><span>Threads/block</span><strong>${product(state.blockDim, currentAxes)}</strong></div><div><span>Blocks/grid</span><strong>${product(state.gridDim, currentAxes)}</strong></div><div><span>Launched threads</span><strong>${totalThreads}</strong></div><div><span>Covered shape</span><strong>${formatTuple(launchedShape, currentAxes)}</strong></div><div class="${unassignedElements ? 'warning' : ''}"><span>Unassigned data</span><strong>${unassignedElements}</strong></div>`;
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
  title.textContent = `Viewing the x–y plane at z = ${state.slice} in a stack of ${total} launched layers`;
  const layersElement = document.createElement('div');
  layersElement.className = 'stack-layers';
  let previous = -1;
  layers.forEach((z) => {
    if (z > previous + 1) {
      const ellipsis = document.createElement('span'); ellipsis.className = 'stack-ellipsis'; ellipsis.textContent = '⋮'; layersElement.append(ellipsis);
    }
    const layer = document.createElement('button');
    const isCurrent = z === state.slice;
    const inBounds = z < state.shape.z;
    layer.type = 'button'; layer.className = `slice-layer${isCurrent ? ' current' : ''}${inBounds ? '' : ' outside'}`;
    layer.textContent = `z = ${z}${inBounds ? '' : ' · outside N'}`;
    layer.setAttribute('aria-pressed', String(isCurrent));
    layer.addEventListener('click', () => { state.slice = z; state.selected.z = z; render(); });
    layersElement.append(layer); previous = z;
  });
  sliceStack.append(title, layersElement);
}

function cellLabel(coordinate) {
  return state.dimensions === 1 ? String(coordinate.x) : `${coordinate.x},${coordinate.y}`;
}

function blockColor(blockIndex) {
  // A color represents one specific CUDA block, including its z coordinate.
  // The coordinate label remains the source of truth once this palette repeats.
  return `hsl(${(blockIndex.x * 47 + blockIndex.y * 91 + blockIndex.z * 137) % 360} 65% 42%)`;
}

function renderMap() {
  map.replaceChildren();
  const currentAxes = axes();
  const blockRows = state.dimensions === 1 ? 1 : state.gridDim.y;
  const threadRows = state.dimensions === 1 ? 1 : state.blockDim.y;
  const launchedDepth = state.blockDim.z * state.gridDim.z;
  map.style.setProperty('--block-columns', state.gridDim.x);
  map.classList.toggle('one-dimensional', state.dimensions === 1);
  if (state.dimensions === 3 && state.slice >= launchedDepth) {
    const empty = document.createElement('p');
    empty.className = 'empty-launch'; empty.textContent = `No CUDA blocks were launched for z = ${state.slice}.`;
    map.append(empty); return;
  }
  for (let by = 0; by < blockRows; by += 1) {
    for (let bx = 0; bx < state.gridDim.x; bx += 1) {
      const blockIndex = { x: bx, y: by, z: state.dimensions === 3 ? Math.floor(state.slice / state.blockDim.z) : 0 };
      const region = document.createElement('section');
      region.className = 'block-region';
      region.style.setProperty('--block-color', blockColor(blockIndex));
      region.style.setProperty('--thread-columns', state.blockDim.x);
      region.setAttribute('aria-label', `CUDA block ${formatTuple(blockIndex, currentAxes)}`);
      const label = document.createElement('p');
      label.className = 'block-label'; label.textContent = `blockIdx ${formatTuple(blockIndex, currentAxes)}`;
      region.append(label);
      for (let ty = 0; ty < threadRows; ty += 1) {
        for (let tx = 0; tx < state.blockDim.x; tx += 1) {
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
        }
      }
      map.append(region);
    }
  }
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
  title.textContent = `${missing.length} data element${missing.length === 1 ? '' : 's'} in this view have no launched thread`;
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
  codeExample.textContent = cudaCode(state.dimensions);
}

function render() { updateInputs(); renderSummary(); renderSliceStack(); renderMap(); renderUnassigned(); renderDetails(); }

document.querySelector('#dimension-picker').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-dimensions]');
  if (!button) return;
  state.dimensions = Number(button.dataset.dimensions); state.selected = { x: 0, y: 0, z: 0 }; state.slice = 0; render();
});

document.querySelector('.controls').addEventListener('input', (event) => {
  const input = event.target;
  if (!input.dataset.key) return;
  state[input.dataset.key][input.dataset.axis] = clamp(input.value);
  if (input.dataset.key === 'shape') state.selected[input.dataset.axis] = Math.min(state.selected[input.dataset.axis], state.shape[input.dataset.axis] - 1);
  render();
});

sliceInput.addEventListener('input', () => { state.slice = Number(sliceInput.value); if (state.dimensions === 3) state.selected.z = state.slice; render(); });
render();
