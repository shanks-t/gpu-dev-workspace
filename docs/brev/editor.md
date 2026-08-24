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
   `/opt/conda/bin/python` if VS Code asks for an interpreter.

The workspace recommends the Python and Pylance extensions. Pylance is
configured to index installed libraries and use their source for types, so
hovering `torch.square`, `torch.cuda.Event`, or `torch.profiler.profile` shows
their signatures and available documentation.

If hover information is absent after reopening, run **Python: Restart Language
Server** and confirm that the selected interpreter is `/opt/conda/bin/python`,
not a host or local Python interpreter.
