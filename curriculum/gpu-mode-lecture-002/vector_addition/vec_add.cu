#include <cuda.h>
#include <stdio.h>
#include <c10/cuda/CUDAException.h>
#include <c10/cuda/CUDAStream.h>


__global__
void vector_add_kernel(float* output, float* a, float* b, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    if (i < n) {
        output[i] = a[i] + b[i];
    }
}

inline unsigned int cdiv(unsigned int a, unsigned int b) {
    return (a + b - 1) / b;
}

torch::Tensor vector_add(torch::Tensor a, torch::Tensor b) {
    // validate a and b are CUDA float tensors
    assert(a.device().type() == torch::kCUDA);
    assert(b.device().type() == torch::kCUDA);
    assert(a.dtype() == torch::kFloat);
    assert(b.dtype() == torch::kFloat);

    // validate they have equal length
    assert(a.dim() == 1);
    assert(b.dim() == 1);
    assert(a.numel() == b.numel());
    // allocate output
    auto output = torch::empty_like(a);
    // choose 256 threads per block
    dim3 threads_per_block(256);
    // calculate number of blocks with cdiv
    dim3 number_of_blocks(cdiv(a.numel(), threads_per_block.x));
    // launch vector_add_kernel
    vector_add_kernel<<<number_of_blocks, threads_per_block, 0, torch::cuda::getCurrentCUDAStream()>>>(
        output.data_ptr<float>(),
        a.data_ptr<float>(),
        b.data_ptr<float>(),
        a.numel()
    );
    // launch error check
    C10_CUDA_KERNEL_LAUNCH_CHECK();

    // return output
    return output;
}