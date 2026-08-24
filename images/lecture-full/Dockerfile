# Immutable RunPod PyTorch base: CUDA 12.8.1, PyTorch 2.8.0, Ubuntu 24.04.
# The published result, not this mutable base tag, is launched by Pod profiles.
FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404@sha256:0a360022e8de4375af99430f84e8b38951acc397252163a37ceac7204d01be35

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TORCH_EXTENSIONS_DIR=/workspace/.cache/torch_extensions \
    TRITON_CACHE_DIR=/workspace/.cache/triton \
    CUDA_CACHE_PATH=/workspace/.cache/nv

RUN apt-get update --yes \
 && apt-get install --yes --no-install-recommends \
      build-essential \
      git \
      openssh-server \
      rsync \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN python -m pip install --requirement /tmp/requirements.txt

RUN command -v nvcc \
 && command -v ncu \
 && command -v nsys \
 && python - <<'PY'
import numba, torch, triton
assert torch.cuda.is_available() is False or torch.version.cuda
print(torch.__version__, triton.__version__, numba.__version__)
PY

WORKDIR /workspace
