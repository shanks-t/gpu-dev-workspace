# CUDA Grid Explorer

An interactive, dependency-free reference for CUDA thread indexing and launch
coverage. Open `index.html` directly in a browser.

It currently covers:

- 1D, 2D, and 3D arrays;
- CUDA grids, blocks, and threads;
- global coordinates and row-major linear indices;
- unused threads and uncovered data;
- CUDA, NumPy, and PyTorch row-major layouts and strides.

`blockDim` accepts CUDA-sized axes (up to 1,024 on x/y and 64 on z), while
enforcing the 1,024 active-thread limit per block. Large configurations use a
compact, representative map capped at 64 blocks and 1,024 clickable cells; the
summary and selected-thread details always use the complete launch.

The implementation intentionally separates mapping math in `mapping.js` from
UI behavior in `app.js`, so future views can add topics such as warps, memory
coalescing, shared-memory tiling, reductions, and grid-stride loops.
