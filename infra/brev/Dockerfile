FROM nvcr.io/nvidia/pytorch:24.07-py3

# Keep the pinned NGC runtime while giving the workspace owner a real home.
RUN groupadd --gid 1000 ubuntu 2>/dev/null || true \
    && if ! id -u ubuntu >/dev/null 2>&1; then \
         useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash ubuntu; \
       fi \
    && install -d --owner=1000 --group=1000 --mode=0755 /home/ubuntu
