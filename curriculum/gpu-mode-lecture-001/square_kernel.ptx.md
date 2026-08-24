# Annotated guide: `square_kernel.ptx`

This guide explains the executable part of [`square_kernel.ptx`](square_kernel.ptx). The trailing `.debug_*` sections in that file are DWARF debugging metadata, so they are not repeated here.

Despite the nearby handwritten CUDA example in [`main.py`](main.py), this PTX came from the Triton implementation in [`triton_square.py`](triton_square.py). The parameter layout, source locations, and repeated row-stride addressing all establish that connection.

## The source operation

```python
# triton_square.py:11-28
@triton.jit
def square_kernel(output_ptr, input_ptr, input_row_stride,
                  output_row_stride, n_cols, BLOCK_SIZE: tl.constexpr):
    row_idx = tl.program_id(0)
    row_start_ptr = input_ptr + row_idx * input_row_stride
    col_offsets = tl.arange(0, BLOCK_SIZE)
    input_ptrs = row_start_ptr + col_offsets
    row = tl.load(input_ptrs, mask=col_offsets < n_cols,
                  other=-float('inf'))
    square_output = row * row
    output_row_start_ptr = output_ptr + row_idx * output_row_stride
    output_ptrs = output_row_start_ptr + col_offsets
    tl.store(output_ptrs, square_output, mask=col_offsets < n_cols)
```

One Triton *program* processes one matrix row. This compiled specialization has `BLOCK_SIZE = 1024` and uses 128 CUDA threads, so each thread owns eight columns:

```text
thread t owns: t, t + 128, t + 256, ..., t + 896
```

For program (CUDA block) `r`, thread `t`, and one of those offsets `o`, the computation is:

```text
if o < n_cols:
    output[r * output_row_stride + o] = input[r * input_row_stride + o] ** 2
```

## PTX quick reference

| Syntax | Meaning |
| --- | --- |
| `%rN` | 32-bit bit/integer register |
| `%rdN` | 64-bit bit/integer register, normally an address |
| `%fN` | 32-bit floating-point register |
| `%pN` | predicate (Boolean) register |
| `@%pN instruction` | Execute only when the predicate is true |
| `@!%pN instruction` | Execute only when the predicate is false |
| `.u32`, `.s32`, `.f32` | unsigned 32-bit, signed 32-bit, float32 operand type |

PTX is a virtual NVIDIA ISA. The driver (or `ptxas`) lowers it to the hardware-specific SASS instructions that run on the GPU.

## Header and kernel signature

```ptx
.version 8.1
.target sm_86
.address_size 64

.visible .entry square_kernel_0d1d234(
    .param .u64 square_kernel_0d1d234_param_0,
    .param .u64 square_kernel_0d1d234_param_1,
    .param .u32 square_kernel_0d1d234_param_2,
    .param .u32 square_kernel_0d1d234_param_3,
    .param .u32 square_kernel_0d1d234_param_4
)
.maxntid 128, 1, 1
```

`.target sm_86` targets Ampere compute capability 8.6. `.address_size 64` means device pointers are 64-bit.

The parameters retain the Triton function order:

| PTX parameter | Triton argument |
| --- | --- |
| `param_0` | `output_ptr` |
| `param_1` | `input_ptr` |
| `param_2` | `input_row_stride`, in elements |
| `param_3` | `output_row_stride`, in elements |
| `param_4` | `n_cols` |

`.maxntid 128, 1, 1` bounds the block to 128 x-direction threads. It explains the eight groups of 128 elements that appear later.

## Registers and launch arguments

```ptx
{
    .reg .pred %p<25>;
    .reg .b32  %r<40>;
    .reg .f32  %f<17>;
    .reg .b64  %rd<24>;

    ld.param.u64 %rd17, [square_kernel_0d1d234_param_0];
    ld.param.u64 %rd18, [square_kernel_0d1d234_param_1];
```

The `.reg` lines declare virtual registers; hardware register allocation happens later. `ld.param` reads from the kernel launch’s parameter block, not from the input tensor. Thus `%rd17` receives `output_ptr` and `%rd18` receives `input_ptr`.

## Map a CUDA thread to eight logical columns

```ptx
    mov.u32  %r25, %tid.x;
    and.b32  %r26, %r25, 127;
    ld.param.u32 %r27, [square_kernel_0d1d234_param_2];
    or.b32   %r28, %r26, 128;
    ld.param.u32 %r29, [square_kernel_0d1d234_param_3];
    or.b32   %r30, %r26, 256;
    ld.param.u32 %r31, [square_kernel_0d1d234_param_4];
    or.b32   %r32, %r26, 384;
    or.b32   %r33, %r26, 512;
    or.b32   %r34, %r26, 640;
    or.b32   %r35, %r26, 768;
    or.b32   %r36, %r26, 896;
    mov.u32  %r37, %ctaid.x;
```

`%tid.x` is the thread ID inside the block; `%ctaid.x` is the block ID. For this 128-thread block, `%r26` is the base column `t`. The bitwise OR instructions safely form `t + 128`, `t + 256`, and so on because `t` is in `[0, 127]`—its higher bits are zero. `%r27`, `%r29`, and `%r31` hold the two strides and `n_cols`.

`%ctaid.x` is Triton’s `tl.program_id(0)`, so `%r37` is `row_idx`.

## Form the input addresses

```ptx
    mul.lo.s32   %r38, %r37, %r27;
    mul.wide.s32 %rd19, %r38, 4;
    add.s64      %rd20, %rd18, %rd19;

    mul.wide.u32 %rd21, %r26, 4;
    add.s64 %rd1, %rd20, %rd21;
    add.s64 %rd2, %rd1, 512;
    add.s64 %rd3, %rd1, 1024;
    add.s64 %rd4, %rd1, 1536;
    add.s64 %rd5, %rd1, 2048;
    add.s64 %rd6, %rd1, 2560;
    add.s64 %rd7, %rd1, 3072;
    add.s64 %rd8, %rd1, 3584;
```

The first three instructions implement `row_start_ptr = input_ptr + row_idx * input_row_stride`. The stride is in elements, so `mul.wide.s32 ... 4` changes it to a byte offset for `float32`; `wide` also widens the result to 64 bits for pointer arithmetic.

`%rd1` is the address for column `t`. Each following address is 512 bytes farther on: `128 floats × 4 bytes`. Across a warp, threads access consecutive float values in each group, which gives the hardware an opportunity to coalesce the global memory accesses.

## Build the mask and load input values

```ptx
    setp.lt.s32 %p1,  %r26, %r31;
    setp.lt.s32 %p3,  %r28, %r31;
    setp.lt.s32 %p5,  %r30, %r31;
    setp.lt.s32 %p7,  %r32, %r31;
    setp.lt.s32 %p9,  %r33, %r31;
    setp.lt.s32 %p11, %r34, %r31;
    setp.lt.s32 %p13, %r35, %r31;
    setp.lt.s32 %p15, %r36, %r31;

    mov.u32 %r2, -8388608;
    mov.u32 %r1, 0x0;
    @%p1  ld.global.b32 { %r1 }, [ %rd1 + 0 ];
    @!%p1 mov.u32 %r1, %r2;
    mov.b32 %f1, %r1;
    // The same four-instruction shape repeats for %rd2..%rd8 / %f2..%f8.
```

Each `setp.lt.s32` creates one predicate for `offset < n_cols`, exactly the Triton load mask. `-8388608` is the bit pattern `0xff800000`, IEEE-754 negative infinity—the `other=-float('inf')` load value.

The first group means:

```text
if t < n_cols:
    f1 = *rd1
else:
    f1 = -infinity
```

`ld.global.b32` loads four raw bits from global (device DRAM) memory. `mov.b32` changes only the register interpretation, not the bit pattern, so `%r1` becomes float register `%f1`. The original repeats this exact pattern for all eight offsets.

## Square all eight values

```ptx
    mul.f32 %f9,  %f1, %f1;
    mul.f32 %f10, %f2, %f2;
    mul.f32 %f11, %f3, %f3;
    mul.f32 %f12, %f4, %f4;
    mul.f32 %f13, %f5, %f5;
    mul.f32 %f14, %f6, %f6;
    mul.f32 %f15, %f7, %f7;
    mul.f32 %f16, %f8, %f8;
```

This is `square_output = row * row`. The vector expression in Triton becomes eight scalar float32 multiplies per CUDA thread. Out-of-bounds entries are `-inf`, which would square to `+inf`, but those entries remain masked at the store and never reach output memory.

## Form output addresses and store conditionally

```ptx
    mul.lo.s32   %r39, %r37, %r29;
    mul.wide.s32 %rd22, %r39, 4;
    add.s64      %rd23, %rd17, %rd22;
    add.s64 %rd9,  %rd23, %rd21;
    add.s64 %rd10, %rd9, 512;
    add.s64 %rd11, %rd9, 1024;
    add.s64 %rd12, %rd9, 1536;
    add.s64 %rd13, %rd9, 2048;
    add.s64 %rd14, %rd9, 2560;
    add.s64 %rd15, %rd9, 3072;
    add.s64 %rd16, %rd9, 3584;

    mov.b32 %r17, %f9;
    @%p1  st.global.b32 [ %rd9  + 0 ], { %r17 };
    mov.b32 %r18, %f10;
    @%p3  st.global.b32 [ %rd10 + 0 ], { %r18 };
    // The pattern repeats for %rd11..%rd16 / %f11..%f16.
    ret;
}
```

The output address calculation mirrors the input calculation, using `output_ptr` and `output_row_stride`. Before each `st.global.b32`, a `mov.b32` again preserves the float bits while treating them as a 32-bit value suitable for the store.

The store uses the exact predicate made for the matching load. An out-of-bounds lane therefore performs no memory write; unlike a masked load, it needs no fallback value.

## Contrast with `main.py`

`main.py` has a separate handwritten CUDA kernel:

```cpp
const int index = blockIdx.x * blockDim.x + threadIdx.x;
if (index < size) {
    output[index] = input[index] * input[index];
}
```

That version assigns one one-dimensional element to each CUDA thread. This PTX instead represents the Triton kernel, where one CUDA block corresponds to one row and each of its 128 threads handles eight columns. Both implement squaring, but their work decomposition—and therefore their generated PTX—differs.

## Reading exercise

Choose program `r`, thread `t`, and the third group (`t + 256`). Trace `%r30` through `%p5`, `%rd3`, `%f3`, `%f11`, and `%rd11`. You should arrive at:

```text
if t + 256 < n_cols:
    output[r * output_row_stride + t + 256] =
        input[r * input_row_stride + t + 256] ** 2
```
