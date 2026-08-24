# Slim immutable CUDA development base. The published result, not this base,
# is launched by Pod profiles.
FROM nvidia/cuda:13.0.2-devel-ubuntu24.04@sha256:5dc1bca23d05bd37b011be68ec470c03b403a5da07ec3a86e41af9470e9d0cc6

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
RUN apt-get update --yes \
 && apt-get install --yes --no-install-recommends python-is-python3 python3-pip python3-venv \
 && python3 -m pip install --break-system-packages --upgrade pip \
 && python3 -m pip install --break-system-packages \
      --index-url https://download.pytorch.org/whl/cu130 \
      torch==2.9.1 torchvision==0.24.1 torchaudio==2.9.1 \
 && python3 -m pip install --break-system-packages --requirement /tmp/requirements.txt

COPY --chmod=755 start-workspace /usr/local/bin/start-workspace

RUN command -v nvcc \
 && command -v ncu \
 && command -v nsys \
 && python3 - <<'PY'
import numba, torch, triton
assert torch.cuda.is_available() is False or torch.version.cuda
print(torch.__version__, triton.__version__, numba.__version__)
PY

WORKDIR /workspace
CMD ["/usr/local/bin/start-workspace"]
