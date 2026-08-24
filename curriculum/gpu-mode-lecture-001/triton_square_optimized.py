"""A contiguous, elementwise Triton square kernel.

Unlike softmax, square does not need to keep rows together: every output value
depends only on the input value at the same position.  That lets us process the
entire contiguous tensor as one long sequence.
"""

import torch
import triton
import triton.language as tl


@triton.jit
def square_kernel_optimized(
    output_ptr,
    input_ptr,
    n_elements,
    BLOCK_SIZE: tl.constexpr,
):
    """Square one contiguous block of elements.

    This is analogous to the SIMD "vector body": a program works on a fixed
    number of adjacent values at once.  `tl.arange` creates the per-program
    vector of element offsets; Triton maps the work across GPU threads/lanes.
    """
    block_id = tl.program_id(0)
    offsets = block_id * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)

    # Only the final program can be partial.  This is the GPU equivalent of a
    # scalar tail, but a mask is preferable to launching a separate tiny kernel:
    # masked lanes neither read nor write out-of-bounds memory.
    mask = offsets < n_elements

    values = tl.load(input_ptr + offsets, mask=mask, other=0.0)
    tl.store(output_ptr + offsets, values * values, mask=mask)


def square_optimized(x: torch.Tensor) -> torch.Tensor:
    """Return ``x * x`` using contiguous blocks plus one masked tail block.

    The kernel deliberately requires contiguous storage.  It walks memory as a
    one-dimensional sequence, so a non-contiguous view would need a separate
    stride-aware kernel (or a preceding ``contiguous()`` copy).
    """
    if not x.is_contiguous():
        raise ValueError("square_optimized requires a contiguous tensor")

    output = torch.empty_like(x)
    n_elements = x.numel()

    # 256 is a starting tuning choice, not a universal constant.  It creates
    # many independent programs, helping this memory-bound operation keep the
    # GPU busy.  Benchmark 256, 512, and 1024 on representative input sizes.
    BLOCK_SIZE = 256
    grid = (triton.cdiv(n_elements, BLOCK_SIZE),)
    square_kernel_optimized[grid](
        output,
        x,
        n_elements,
        BLOCK_SIZE=BLOCK_SIZE,
        num_warps=4,
    )
    return output


if __name__ == "__main__":
    # This shape deliberately has a non-zero tail: only the final program is
    # masked, rather than having a masked remainder in every row.
    x = torch.randn(1823, 781, device="cuda")
    y_triton = square_optimized(x)
    y_torch = torch.square(x)
    torch.testing.assert_close(y_triton, y_torch)
