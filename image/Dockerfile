# syntax=docker/dockerfile:1.7

FROM --platform=linux/amd64 nvidia/cuda:13.0.2-devel-ubuntu24.04@sha256:0eee3094c71518ad31d011a594ae6ed6de72959ee07e318cb31cffe71690e90c

ARG DEBIAN_FRONTEND=noninteractive
ARG IMAGE_VERSION=dev
ARG IMAGE_REVISION=unknown

LABEL org.opencontainers.image.title="GPU Development Workspace" \
      org.opencontainers.image.description="Pinned CUDA, PyTorch, Triton, and Nsight toolchain for GPU performance development" \
      org.opencontainers.image.source="https://github.com/shanks-t/gpu-dev-workspace" \
      org.opencontainers.image.version="$IMAGE_VERSION" \
      org.opencontainers.image.revision="$IMAGE_REVISION" \
      org.opencontainers.image.licenses="MIT"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates=20260601~24.04.1 \
        cmake=3.28.3-1build7 \
        curl=8.5.0-2ubuntu10.12 \
        git=1:2.43.0-1ubuntu7.3 \
        jq=1.7.1-3ubuntu0.24.04.2 \
        ninja-build=1.11.1-2 \
        nsight-systems-2025.6.3=2025.6.3.541-256337736014v0 \
        openssh-server=1:9.6p1-3ubuntu13.18 \
        procps=2:4.0.4-4ubuntu3.2 \
        python3=3.12.3-0ubuntu2.1 \
        python3-pip=24.0+dfsg-1ubuntu1.3 \
        python3-venv=3.12.3-0ubuntu2.1 \
        rsync=3.2.7-1ubuntu1.5 \
        tini=0.19.0-1 \
        unzip=6.0-28ubuntu4.1 \
        wget=1.21.4-1ubuntu4.5 \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/gpu-venv
ENV VIRTUAL_ENV=/opt/gpu-venv
ENV PATH="/opt/gpu-venv/bin:/usr/local/cuda/bin:${PATH}"

COPY image/requirements-base.txt image/requirements-cuda.txt /tmp/
RUN python -m pip install --no-cache-dir --upgrade pip==26.0.1 \
    && python -m pip install --no-cache-dir -r /tmp/requirements-base.txt \
    && python -m pip install --no-cache-dir \
        --index-url https://download.pytorch.org/whl/cu130 \
        -r /tmp/requirements-cuda.txt \
    && rm /tmp/requirements-base.txt /tmp/requirements-cuda.txt

COPY image/start-gpu-workspace /usr/local/bin/start-gpu-workspace
COPY image/smoke-test /usr/local/bin/gpu-image-smoke-test
COPY image/smoke/ /opt/gpu-workspace-smoke/

RUN chmod 0755 /usr/local/bin/start-gpu-workspace /usr/local/bin/gpu-image-smoke-test \
    && mkdir -p /run/sshd /workspace \
    && find /etc/ssh -maxdepth 1 -type f -name 'ssh_host_*' -delete \
    && printf '%s\n' \
        'PasswordAuthentication no' \
        'KbdInteractiveAuthentication no' \
        'PermitRootLogin prohibit-password' \
        'PubkeyAuthentication yes' \
        'AllowAgentForwarding no' \
        > /etc/ssh/sshd_config.d/99-gpu-workspace.conf \
    && printf '%s\n' \
        'export VIRTUAL_ENV=/opt/gpu-venv' \
        'export PATH=/opt/gpu-venv/bin:/usr/local/cuda/bin:$PATH' \
        > /etc/profile.d/gpu-workspace.sh \
    && gpu-image-smoke-test --build

ENV HF_HOME=/workspace/.cache/huggingface \
    TORCH_HOME=/workspace/.cache/torch \
    TRITON_CACHE_DIR=/workspace/.cache/triton \
    XDG_CACHE_HOME=/workspace/.cache

EXPOSE 22
WORKDIR /workspace
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/start-gpu-workspace"]
CMD ["sleep", "infinity"]
