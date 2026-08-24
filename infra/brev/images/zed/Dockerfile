FROM nvcr.io/nvidia/pytorch:24.07-py3

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --yes --no-install-recommends openssh-server \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 --shell /bin/bash zed \
    && mkdir --parents /home/zed/.ssh \
    && chown --recursive zed:zed /home/zed/.ssh

COPY start-sshd /usr/local/bin/start-sshd

RUN chmod 0755 /usr/local/bin/start-sshd

EXPOSE 22

ENTRYPOINT ["/usr/local/bin/start-sshd"]
