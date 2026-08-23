#include <cuda_runtime.h>

#include <cstdio>

__global__ void increment(int* value) {
  *value += 1;
}

int main() {
  int initial = 41;
  int result = 0;
  int* device_value = nullptr;

  if (cudaMalloc(&device_value, sizeof(int)) != cudaSuccess ||
      cudaMemcpy(device_value, &initial, sizeof(int), cudaMemcpyHostToDevice) != cudaSuccess) {
    return 1;
  }

  increment<<<1, 1>>>(device_value);
  if (cudaGetLastError() != cudaSuccess || cudaDeviceSynchronize() != cudaSuccess ||
      cudaMemcpy(&result, device_value, sizeof(int), cudaMemcpyDeviceToHost) != cudaSuccess) {
    cudaFree(device_value);
    return 1;
  }

  cudaFree(device_value);
  if (result != 42) {
    return 1;
  }

  std::printf("CUDA answer: %d\n", result);
  return 0;
}
