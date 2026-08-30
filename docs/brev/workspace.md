# GPU kernel development workspace

This is the supported, low-friction loop for editing, running, testing, and
pushing GPU code. VS Code connects only to the Brev VM through Remote SSH.
Docker Compose supplies the NGC GPU runtime without becoming a second VS Code
workspace.

| Location | Path |
| --- | --- |
| Edit, Git, VS Code terminal | Brev VM: `/home/ubuntu/workspace` |
| CUDA, PyTorch, Triton, JupyterLab | NGC Compose service: `/workspace` |
| Git branch on the VM | `remote` |

The two paths are the same files: the NGC service bind-mounts the VM checkout.
Saving in VS Code makes an edit immediately available to the GPU runtime.

## One-time setup

Install and authenticate the Brev CLI on the Mac, then set your Git identity.
`open-workspace` copies that identity to the VM checkout.

```sh
brew install brevdev/homebrew-brev/brev
brev login
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Install VS Code with the **Remote - SSH** extension. The VM workspace must be a
Git clone on branch `remote`. If it contains an old rsync workspace, use the
migration scripts in `infra/brev/scripts/` first; never replace the checkout
with rsync.

## Start a development session

From a local clone, run one command. `--pull` fast-forwards the VM checkout, so
omit it when the VM has uncommitted edits.

```sh
infra/brev/scripts/open-workspace gpu-fundamentals --confirm-start --pull
```

It starts or reuses the VM, configures Git on its `remote` checkout, launches
the NGC Jupyter GPU runtime, and opens VS Code at
`/home/ubuntu/workspace` through Remote SSH. This is the only VS Code window
you need. Auto Save is configured for this workspace.

Do not run **Dev Containers: Reopen in Container** or **Attach to Running
Container**. They are not part of this workflow.

## Run GPU code from the editor

Use the VS Code build shortcut (**Cmd+Shift+B** on macOS, **Ctrl+Shift+B** on
Windows/Linux) to run the active Python file in the NGC GPU runtime. It runs
the file at `/workspace/${relativeFile}` and streams output in the integrated
terminal.

The Command Palette command **Tasks: Run Task** also provides:

- **GPU: CUDA and PyTorch Check** — verifies the active CUDA GPU and versions.
- **GPU: Open Runtime Shell** — opens a shell inside the NGC environment.

The host Python on the VM intentionally does not provide PyTorch or CUDA. Run
GPU commands through these tasks or from the runtime shell. For example:

```sh
python curriculum/gpu-mode-lecture-001/pytorch_square.py
```

## JupyterLab

The Jupyter service is bound only to VM loopback at port 8889. Remote SSH
automatically forwards it and opens it once in your local browser. If it does
not open, use VS Code's **Ports** view and click the globe beside **GPU
JupyterLab**, then open `http://localhost:8889`.

The browser JupyterLab session already uses the GPU-enabled NGC Python. The
connectivity notebook at `infra/brev/scripts/connectivity-test.ipynb` should
report CUDA availability and the active GPU.

## Review and synchronize

Because edits are saved on the VM, I can review the latest remote Git diff
without Codex being installed in the VM. Ask me to “review the remote diff”; I
will inspect `/home/ubuntu/workspace` through Brev.

Use the VS Code Source Control view to commit and push, or run this in the
Remote SSH terminal:

```sh
git status
git diff
git add PATHS
git commit -m "feat: improve kernel"
git push origin remote
```

Update your Mac checkout when needed:

```sh
git pull --ff-only origin remote
```

Never use delete-based source sync: it can overwrite VM edits and Git metadata.

## Finish

Stop the VM when the session ends to stop compute billing:

```sh
brev stop gpu-fundamentals
```

The VM retains its checkout and image while stopped. Before the next session,
review `git status`; use `--pull` only when the checkout is clean.

## Why this avoids Dev Containers

The previous Dev Containers route is disabled because its current VS Code
extension crashes during Remote SSH initialization with Docker 29, before the
container can open. The failure is tracked in [VS Code Remote
#11655](https://github.com/microsoft/vscode-remote-release/issues/11655).
Remote SSH plus Docker Compose has the same mounted files and GPU runtime,
without a second VS Code window or the failing integration.
