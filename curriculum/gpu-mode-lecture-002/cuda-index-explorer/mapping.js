export const AXES = ['x', 'y', 'z'];

export function activeAxes(dimensions) {
  return AXES.slice(0, dimensions);
}

export function product(values, axes) {
  return axes.reduce((total, axis) => total * values[axis], 1);
}

export function coordinateToLinear(coordinate, shape, axes) {
  let linear = 0;
  let stride = 1;
  axes.forEach((axis) => {
    linear += coordinate[axis] * stride;
    stride *= shape[axis];
  });
  return linear;
}

export function threadToCoordinate(blockIndex, threadIndex, blockDim, axes) {
  return Object.fromEntries(axes.map((axis) => [axis, blockIndex[axis] * blockDim[axis] + threadIndex[axis]]));
}

export function coordinateToBlockAndThread(coordinate, blockDim, axes) {
  const blockIndex = {};
  const threadIndex = {};
  axes.forEach((axis) => {
    blockIndex[axis] = Math.floor(coordinate[axis] / blockDim[axis]);
    threadIndex[axis] = coordinate[axis] % blockDim[axis];
  });
  return { blockIndex, threadIndex };
}

export function isInBounds(coordinate, shape, axes) {
  return axes.every((axis) => coordinate[axis] < shape[axis]);
}

export function formatTuple(values, axes) {
  return `(${axes.map((axis) => values[axis]).join(', ')})`;
}

export function cudaCode(dimensions) {
  const coordinateLines = {
    x: 'int x = blockIdx.x * blockDim.x + threadIdx.x;',
    y: 'int y = blockIdx.y * blockDim.y + threadIdx.y;',
    z: 'int z = blockIdx.z * blockDim.z + threadIdx.z;',
  };
  const axes = activeAxes(dimensions);
  const guard = axes.map((axis) => `${axis} < n${axis}`).join(' && ');
  const linear = dimensions === 1
    ? 'int linear = x;'
    : dimensions === 2
      ? 'int linear = y * nx + x;'
      : 'int linear = (z * ny + y) * nx + x;';
  return [...axes.map((axis) => coordinateLines[axis]), '', `if (${guard}) {`, `  ${linear}`, '  output[linear] = input[linear];', '}'].join('\n');
}
