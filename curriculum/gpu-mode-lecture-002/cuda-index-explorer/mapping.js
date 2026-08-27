const CudaMapping = (() => {
const AXES = ['x', 'y', 'z'];

function activeAxes(dimensions) {
  return AXES.slice(0, dimensions);
}

function product(values, axes) {
  return axes.reduce((total, axis) => total * values[axis], 1);
}

function coordinateToLinear(coordinate, shape, axes) {
  let linear = 0;
  let stride = 1;
  axes.forEach((axis) => {
    linear += coordinate[axis] * stride;
    stride *= shape[axis];
  });
  return linear;
}

function threadToCoordinate(blockIndex, threadIndex, blockDim, axes) {
  return Object.fromEntries(axes.map((axis) => [axis, blockIndex[axis] * blockDim[axis] + threadIndex[axis]]));
}

function coordinateToBlockAndThread(coordinate, blockDim, axes) {
  const blockIndex = {};
  const threadIndex = {};
  axes.forEach((axis) => {
    blockIndex[axis] = Math.floor(coordinate[axis] / blockDim[axis]);
    threadIndex[axis] = coordinate[axis] % blockDim[axis];
  });
  return { blockIndex, threadIndex };
}

function isInBounds(coordinate, shape, axes) {
  return axes.every((axis) => coordinate[axis] < shape[axis]);
}

function formatTuple(values, axes) {
  return `(${axes.map((axis) => values[axis]).join(', ')})`;
}

function cudaCode(dimensions, blockDim, gridDim) {
  const coordinateLines = {
    x: 'int x = blockIdx.x * blockDim.x + threadIdx.x;',
    y: 'int y = blockIdx.y * blockDim.y + threadIdx.y;',
    z: 'int z = blockIdx.z * blockDim.z + threadIdx.z;',
  };
  const axes = activeAxes(dimensions);
  const guard = axes.map((axis) => `${axis} < n${axis}`).join(' && ');
  const sizeArguments = axes.map((axis) => `int n${axis}`).join(', ');
  const launchArguments = axes.map((axis) => `n${axis}`).join(', ');
  const linear = dimensions === 1
    ? 'int linear = x;'
    : dimensions === 2
      ? 'int linear = y * nx + x;'
      : 'int linear = (z * ny + y) * nx + x;';
  const blockValues = axes.map((axis) => blockDim[axis]).join(', ');
  const gridValues = axes.map((axis) => gridDim[axis]).join(', ');
  return [
    `__global__ void mapKernel(const float* input, float* output, ${sizeArguments}) {`,
    ...axes.map((axis) => `  ${coordinateLines[axis]}`),
    '',
    `  if (${guard}) {`,
    `    ${linear}`,
    '    output[linear] = input[linear];',
    '  }',
    '}',
    '',
    `dim3 block(${blockValues});`,
    `dim3 grid(${gridValues});`,
    `mapKernel<<<grid, block>>>(input, output, ${launchArguments});`,
  ].join('\n');
}

return { AXES, activeAxes, product, coordinateToLinear, threadToCoordinate, coordinateToBlockAndThread, isInBounds, formatTuple, cudaCode };
})();
