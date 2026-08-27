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
  sliceInput.max = String(Math.max(0, state.blockDim.z * state.gridDim.z - 1));
  state.slice = Math.min(state.slice, Number(sliceInput.max)); sliceInput.value = String(state.slice); sliceOutput.textContent = String(state.slice);
}

function renderSummary() {
  const currentAxes = axes();
  const totalThreads = product(state.blockDim, currentAxes) * product(state.gridDim, currentAxes);
  const dataElements = product(state.shape, currentAxes);
  const launchedShape = Object.fromEntries(currentAxes.map((axis) => [axis, state.blockDim[axis] * state.gridDim[axis]]));
  summary.innerHTML = `<div><span>Data elements</span><strong>${dataElements}</strong></div><div><span>Threads/block</span><strong>${product(state.blockDim, currentAxes)}</strong></div><div><span>Blocks/grid</span><strong>${product(state.gridDim, currentAxes)}</strong></div><div><span>Launched threads</span><strong>${totalThreads}</strong></div><div><span>Covered shape</span><strong>${formatTuple(launchedShape, currentAxes)}</strong></div>`;
}

function cellLabel(coordinate) {
  return state.dimensions === 1 ? String(coordinate.x) : `${coordinate.x},${coordinate.y}`;
}

function renderMap() {
  map.replaceChildren();
  const currentAxes = axes();
  const width = state.blockDim.x * state.gridDim.x;
  const height = state.dimensions === 1 ? 1 : state.blockDim.y * state.gridDim.y;
  map.style.setProperty('--columns', width);
  map.classList.toggle('one-dimensional', state.dimensions === 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const coordinate = { x, y, z: state.dimensions === 3 ? state.slice : 0 };
      const { blockIndex, threadIndex } = coordinateToBlockAndThread(coordinate, state.blockDim, currentAxes);
      const valid = isInBounds(coordinate, state.shape, currentAxes);
      const chosen = currentAxes.every((axis) => coordinate[axis] === state.selected[axis]);
      const button = document.createElement('button');
      button.type = 'button'; button.className = `cell${valid ? '' : ' outside'}${chosen ? ' selected' : ''}`;
      button.style.setProperty('--block-color', `hsl(${(blockIndex.x * 47 + blockIndex.y * 91 + blockIndex.z * 137) % 360} 65% 45%)`);
      button.textContent = cellLabel(coordinate);
      button.title = `blockIdx ${formatTuple(blockIndex, currentAxes)}, threadIdx ${formatTuple(threadIndex, currentAxes)}`;
      button.setAttribute('aria-label', `data coordinate ${formatTuple(coordinate, currentAxes)}`);
      button.addEventListener('click', () => { state.selected = coordinate; render(); });
      map.append(button);
    }
  }
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

function render() { updateInputs(); renderSummary(); renderMap(); renderDetails(); }

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
