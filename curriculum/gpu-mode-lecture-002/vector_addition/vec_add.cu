#include <cuda.h>
#include <stdio.h>


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
    // validate they have equal length
    // allocate output
    // choose 256 threads per block
    // calculate number of blocks with cdiv
    // launch vector_add_kernel
    // launch error check
    // return output
}