# CUDA Grid Explorer

An interactive, dependency-free reference for CUDA thread indexing and launch
coverage. Open `index.html` directly in a browser.

It currently covers:

- 1D, 2D, and 3D arrays;
- CUDA grids, blocks, and threads;
- global coordinates and row-major linear indices;
- unused threads and uncovered data;
- CUDA, NumPy, and PyTorch row-major layouts and strides.

The implementation intentionally separates mapping math in `mapping.js` from
UI behavior in `app.js`, so future views can add topics such as warps, memory
coalescing, shared-memory tiling, reductions, and grid-stride loops.
