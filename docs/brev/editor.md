# Editor support

Python hover documentation and type information for the curriculum requires an
interpreter that has the same PyTorch installation as the exercise runtime.
This repository's local macOS interpreter does not need PyTorch installed.
Instead, open the workspace in the pinned NGC PyTorch development container on
the Brev VM.

## VS Code setup

1. Connect to the approved Brev VM with the **Remote - SSH** extension.
2. Open `/home/ubuntu/workspace` on the VM.
3. Run **Dev Containers: Reopen in Container**. VS Code uses
   `.devcontainer/devcontainer.json`, which starts the repository's pinned NGC
   PyTorch compose service.
4. Open `curriculum/brev/gpu-mode-lecture-001/pytorch_square.py` and choose
   `/usr/bin/python` if VS Code asks for an interpreter.

The workspace recommends the Python and Pylance extensions. Pylance is
configured to index installed libraries and use their source for types, so
hovering `torch.square`, `torch.cuda.Event`, or `torch.profiler.profile` shows
their signatures and available documentation.

If hover information is absent after reopening, run **Python: Restart Language
Server** and confirm that the selected interpreter is `/usr/bin/python`,
not a host or local Python interpreter.

## Zed setup

Zed cannot reopen a Remote SSH project in a development container. Instead,
run an SSH endpoint inside the pinned PyTorch container and connect Zed directly
to that endpoint. This makes Zed's language server run in the same environment
as the exercises, including its installed PyTorch documentation.

### Start the Zed container

Synchronize the repository to an approved VM, then start the Zed-specific
container. The SSH port is bound to the VM loopback interface only; it is not
exposed publicly.

```sh
infra/brev/scripts/sync-source gpu-profiling
ssh gpu-profiling '
  cd /home/ubuntu/workspace
  docker compose -f infra/brev/compose/zed-pytorch.compose.yaml up --detach --build
'
```

If the NGC image is not already present on the VM, run
`infra/brev/scripts/ngc-login gpu-profiling` first.

### Connect Zed

Add this one-time entry to the Mac's `~/.ssh/config`; replace `gpu-profiling`
with the Brev instance name when needed:

```sshconfig
Host gpu-profiling-zed
  HostName 127.0.0.1
  Port 2222
  User zed
  ProxyJump gpu-profiling
```

In Zed, open **Remote Projects**, connect to `gpu-profiling-zed`, and open
`/workspace`. The `.zed/settings.json` project configuration makes
basedpyright analyze the full workspace and retain library source. Verify the
connection before opening Zed:

```sh
ssh gpu-profiling-zed 'python -c "import torch; print(torch.__version__)"'
```

Hover `torch.square` or `torch.profiler.profile` to view PyTorch signatures and
documentation. Use **Editor: Restart Language Server** if Zed finishes its
initial indexing without providing hover information.

### Stop the Zed container

```sh
ssh gpu-profiling '
  cd /home/ubuntu/workspace
  docker compose -f infra/brev/compose/zed-pytorch.compose.yaml down
'
```
