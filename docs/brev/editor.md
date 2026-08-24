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

## Zed setup

1. Run `brev refresh` on the Mac so the Brev instance is available through
   SSH.
2. In Zed, open the **Remote Projects** dialog and connect using the same SSH
   host alias used by `brev shell INSTANCE`. Open
   `/home/ubuntu/workspace` on the VM.
3. When Zed detects `.devcontainer/devcontainer.json`, choose **Open in
   Container**. If the prompt was dismissed, use **Project: Open Remote** from
   the command palette and choose the dev-container option.
4. Open `curriculum/brev/gpu-mode-lecture-001/pytorch_square.py`. In the
   toolchain selector, select `/opt/conda/bin/python` if Zed did not choose it
   automatically.

Zed runs its language servers in the remote development container, so its
built-in basedpyright server can inspect the installed PyTorch package. The
project's `.zed/settings.json` asks it to analyze the workspace and retain
library source for type information. Hover `torch.square` or
`torch.profiler.profile` to view their signature and documentation.

If imports or hover documentation are missing, verify the project is running
in the container and the selected toolchain is `/opt/conda/bin/python`. Then
run **Editor: Restart Language Server** and inspect **Dev: Open Language Server
Logs** if the issue continues.
