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

Zed supports either a local development container or an SSH remote project, but
it does not currently support opening a development container on an SSH remote
host. Do not choose **Open in Container** for this project on the Mac: Zed will
run the Compose configuration locally, where it cannot use the Brev GPU image
or the remote Docker daemon.

To use Zed today, connect with **Remote Projects** to the Brev VM and open
`/home/ubuntu/workspace`. This gives Zed remote editing, but its language
server runs on the VM host rather than in the pinned NGC container. The
project's `.zed/settings.json` configures Zed's basedpyright server to retain
library source whenever the selected toolchain has PyTorch installed.

For the fully reproducible NGC PyTorch environment and complete hover
documentation, use VS Code's Remote SSH plus Dev Containers workflow above.
Zed support for remote development containers must be added upstream before the
same workflow can work in Zed.
