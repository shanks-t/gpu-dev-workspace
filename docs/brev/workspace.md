# GPU kernel development workspace

This is the single workflow for editing, testing, profiling, and pushing GPU
kernel changes. The Mac runs VS Code and Git synchronization; the Brev VM
stores the checkout; the NGC Dev Container runs CUDA, PyTorch, Triton, and
profilers.

| Location | Path |
| --- | --- |
| VM (Remote SSH) | `/home/ubuntu/workspace` |
| Dev Container | `/workspace` |
| Git branch on the VM | `remote` |

## One-time setup

Install and authenticate the Brev CLI on the Mac, then configure Git author
information locally. The workspace command copies it to the VM checkout.

```sh
brew install brevdev/homebrew-brev/brev
brev login
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

The VM workspace must be a Git clone on branch `remote`. If it contains an old
rsync workspace, use the migration scripts in `infra/brev/scripts/` first.
Never replace the checkout with rsync.

## Start a development session

Reuse the existing VM. Starting it incurs runtime cost; `--confirm-start`
makes that explicit. `--pull` fast-forwards the VM checkout, so omit it if the
VM has uncommitted edits.

```sh
infra/brev/scripts/open-workspace gpu-fundamentals --confirm-start --pull
```

The command starts the NGC Jupyter service, installs the Dev Containers Docker
compatibility wrapper on the VM, configures Git identity, and opens VS Code
through Remote SSH at `/home/ubuntu/workspace`.

In that **same VS Code window**, run **Dev Containers: Reopen in Container**.
It opens the configured `jupyter` service with `/workspace` as the folder.
Do **not** use **Attach to Running Container**: it opens a separate window
without the workspace context.

Verify the attached terminal:

```sh
pwd
# /workspace
```

## Docker 29 workaround

Docker Engine 29 omits `Client.Components` from `docker version --format
{{json .}}`. Dev Containers expects that field and crashes before it can reopen
the workspace. The wrapper installed by `open-workspace` adds that field only
for this version query; all other commands delegate to `/usr/bin/docker`.

The upstream issue is [VS Code Remote #11655](https://github.com/microsoft/vscode-remote-release/issues/11655).
If VS Code was connected before the wrapper was installed, run **Developer:
Reload Window**, reconnect with `brev open gpu-fundamentals code`, then use
**Reopen in Container**.

## Edit, test, and profile

Edit beneath `/workspace`. Auto Save is enabled, so saved VS Code changes are
visible to shell commands and code-review tools.

Run GPU work from a Dev Container terminal:

```sh
python curriculum/gpu-mode-lecture-001/pytorch_square.py
python - <<'PY'
import torch
print(torch.cuda.is_available(), torch.cuda.get_device_name(0))
PY
```

For a one-off host command, use the same pinned environment:

```sh
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'python curriculum/gpu-mode-lecture-001/pytorch_square.py'
```

For notebooks, choose the container Python kernel (`/usr/bin/python`). The VM
host Python intentionally does not include PyTorch. The connectivity notebook
at `infra/brev/scripts/connectivity-test.ipynb` should report CUDA available
and the active GPU.

## Commit and synchronize

Commit from the Dev Container terminal. `/workspace` is the VM checkout, so
the host sees the same changes immediately.

```sh
git status
git diff
git add PATHS
git commit -m "feat: improve kernel"
git push origin remote
```

On the Mac, retrieve the remote commit:

```sh
git pull --ff-only origin remote
```

Never use delete-based source sync: it can overwrite VM edits and Git metadata.

## Finish

Stop the VM when the session ends to stop compute billing:

```sh
brev stop gpu-fundamentals
```

The VM retains its checkout and image while stopped. Review `git status`
before the next session and use `--pull` only when the checkout is clean.
