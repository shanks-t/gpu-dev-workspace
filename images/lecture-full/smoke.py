import subprocess

import numba
import torch
import triton

assert torch.cuda.is_available(), "PyTorch cannot access CUDA"
assert torch.rand(8, device="cuda").square().is_cuda
assert numba.cuda.is_available(), "Numba cannot access CUDA"
for executable in ("nvcc", "ncu", "nsys"):
    subprocess.run([executable, "--version"], check=True)
print(f"torch={torch.__version__} triton={triton.__version__} numba={numba.__version__}")
