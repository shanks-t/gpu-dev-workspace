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
      ca-certificates \
      git \
      gnupg \
      openssh-server \
      rsync \
      wget \
 && wget -qO- https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/7fa2af80.pub \
      | gpg --dearmor --output /usr/share/keyrings/nvidia-devtools-keyring.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/nvidia-devtools-keyring.gpg] https://developer.download.nvidia.com/devtools/repos/ubuntu2404/$(dpkg --print-architecture)/ /" \
      > /etc/apt/sources.list.d/nvidia-devtools.list \
 && apt-get update --yes \
 && apt-get install --yes --no-install-recommends nsight-systems-cli \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/requirements.txt
RUN python -m pip install --requirement /tmp/requirements.txt

COPY --chmod=755 start-workspace /usr/local/bin/start-workspace

RUN command -v nvcc \
 && command -v ncu \
 && command -v nsys \
 && python - <<'PY'
import numba, torch, triton
assert torch.cuda.is_available() is False or torch.version.cuda
print(torch.__version__, triton.__version__, numba.__version__)
PY

WORKDIR /workspace
CMD ["/usr/local/bin/start-workspace"]
