#include <cstdio>
#include <cuda_runtime.h>

__global__ void answer(int *out) { *out = 42; }

int main() {
  int *value;
  cudaMallocManaged(&value, sizeof(*value));
  answer<<<1, 1>>>(value);
  cudaDeviceSynchronize();
  const int result = *value;
  std::printf("CUDA answer: %d\n", result);
  cudaFree(value);
  return result == 42 ? 0 : 1;
}
