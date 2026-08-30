# CUDA / PyTorch Quiz 002

We will work through these in order. Check an item only after you can explain it in your own words. Use your remote Jupyter kernel for the suggested experiments, then explain what you observed. The grayscale kernel is first because each thread transforms exactly one pixel; the mean filter adds channels, loops, and edge handling.

## Notebook workflow

- [ ] Confirm the remote notebook kernel can import `torch` and that `torch.cuda.is_available()` is `True`.
- [ ] For each experiment, predict the result before running it; then compare the output with your prediction.
- [ ] Keep a scratch notebook with small tensors so results are easy to inspect (for example, a `2 x 3 x 3` image rather than `Grace_Hopper.jpg`).

## RGB to grayscale

- [x] 1. In `rgb_to_grayscale.py`, what are the shape, dtype, and device of `x` immediately before `ext.rgb_to_grayscale(x)`? Confirm it with a notebook cell that prints `x.shape`, `x.dtype`, and `x.device`.
- [x] 2. What does `permute(1, 2, 0)` change, and why does the grayscale kernel expect that layout? Create a tiny channel-first tensor with distinct values and inspect it before and after `permute(1, 2, 0)`.
- [x] 3. What does `__global__` mean on `rgb_to_grayscale_kernel`?
- [x] 4. Explain the difference between a CUDA grid, a block, and a thread.
- [x] 5. For `dim3 threads_per_block(16, 16)`, how many threads does each block contain?
- [x] 6. What do `blockIdx`, `blockDim`, and `threadIdx` represent in the expressions for `col` and `row`?
- [x] 7. Given `blockIdx.x = 2`, `blockDim.x = 16`, and `threadIdx.x = 5`, what value does `col` have? Confirm the arithmetic in Python.
- [x] 8. Why is `if (col < width && row < height)` required, even though the launch dimensions are based on the image size?
- [x] 9. For a pixel at `(row, col)`, explain why its grayscale output index is `row * width + col`.
- [x] 10. Why is the RGB input index `(row * width + col) * 3`? Which values are read at `inputOffset + 0`, `+1`, and `+2`? Verify this by flattening a tiny `(height, width, 3)` tensor.
- [x] 11. What do the `0.21`, `0.71`, and `0.07` coefficients do, and why is a float calculation cast back to `unsigned char`? Calculate the output for one hand-picked RGB pixel in a notebook.
- [x] 12. What does `cdiv(width, threads_per_block.x)` calculate? Evaluate `cdiv(33, 16)`.
- [x] 13. If an image is 33 pixels wide and 17 pixels high, what are `number_of_blocks.x` and `.y`? How many launched threads lie outside the image? Verify the counts with a small Python calculation.
- [x] 14. What do `data_ptr<unsigned char>()`, `torch::empty(...)`, and the CUDA stream argument provide to the kernel launch?
- [x] 15. What preconditions do the C++ `assert`s enforce, and what error does `C10_CUDA_KERNEL_LAUNCH_CHECK()` help detect?
- [x] 16. Run the provided grayscale program remotely (or its equivalent in a notebook), inspect its input/output shapes and a few output pixels, then explain the complete program in English: `main()` reads the image; Python compiles/loads the extension; the C++ wrapper launches CUDA threads; each thread calculates one grayscale pixel; Python writes the output image.

## Mean filter

- [x] 17. How is the mean-filter input layout `(channels, height, width)` different from the grayscale layout `(height, width, channels)`?
- [x] 18. In the mean filter, what work does one thread perform, and how is its `channel` selected?
- [x] 19. Explain `baseOffset = channel * height * width` for a three-channel, channel-first image.
- [x] 20. For `radius = 1`, how many candidate positions does the nested loop inspect for a pixel away from an edge? Verify with a tiny CPU/PyTorch loop or a printed list of offsets.
- [x] 21. Why are `pixels` and the bounds check necessary? What happens conceptually at an image corner? Use a tiny image to list the valid neighboring coordinates for a corner.
- [x] 22. Why are `pixVal` and `pixels` `int`s while the input and output pixels are `unsigned char`?
- [x] 23. What output does a radius-1 mean filter produce for a pixel, in words and as a short formula? Run the provided mean-filter example remotely and compare an interior pixel with a corner pixel.
- [x] 24. Why does the mean filter use `threads_per_block(16, 16, channels)` but only a two-dimensional grid?

## Build toward vector add

- [x] 25. Design the mapping: if a vector has length `n`, which single output element should thread index `i` compute?
- [x] 26. Choose a one-dimensional launch configuration and write the formulas for `i` and the bounds check.
- [x] 27. Write a `__global__` CUDA kernel that computes `out[i] = a[i] + b[i]` for float vectors.
- [x] 28. Write the PyTorch C++ wrapper: validate CUDA tensors, allocate output, calculate block count with `cdiv`, launch on the current CUDA stream, and check launch errors.
- [ ] 29. Write a small notebook driver using `load_inline` that creates inputs, calls your extension, and verifies its output with `torch.allclose` against PyTorch's `a + b`.
