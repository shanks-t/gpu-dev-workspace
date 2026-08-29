# Edit and commit in the remote NGC workspace

Use VS Code Remote SSH to open the Git checkout on the Brev VM, then reopen it
in the NGC Dev Container. The Mac is for Git synchronization and editor access;
do not run GPU lesson code with its Python interpreter.

## One-time local setup

Each lecture has a self-contained `uv` project for local syntax, type, and
hover support:

```sh
cd curriculum/gpu-mode-lecture-001
uv sync --python 3.11
```

Open the repository in Zed and select
`curriculum/gpu-mode-lecture-001/.venv` as its Python toolchain. Zed can then
resolve the macOS-compatible dependencies for static feedback. Triton is not a
supported macOS runtime, so run Triton and CUDA code on the VM.

## Edit, review, commit, push, pull

1. Complete the [one-time Git workspace migration](git-workspace.md) before
   opening an existing rsync workspace.
2. Start or choose `INSTANCE` with the [GPU VM selection guide](instance-selection.md).
3. Open the remote checkout in VS Code and reopen it in the Dev Container:

   ```sh
   infra/brev/scripts/open-workspace INSTANCE --confirm-start
   ```

4. Edit under `/workspace`, then review and commit from the VM checkout:

   ```sh
   cd /home/ubuntu/workspace
   git status
   git diff
   git add PATHS
   git commit -m "type: summary"
   git push origin remote
   ```

5. On the Mac, retrieve the commit:

   ```sh
   git pull --ff-only origin remote
   ```

6. To run an exercise manually on the VM, use NGC:

   ```sh
   cd /home/ubuntu/workspace
   docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
     'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
   ```

`sync-source` is retired: delete-based rsync would overwrite remote edits and
remove the checkout's Git metadata.

## VS Code notebooks in the NGC container

For interactive notebooks, use VS Code Remote SSH to reach the Brev VM, then
reopen the repository in its NGC Dev Container. This puts the VS Code Python
and Jupyter extensions in the same environment as CUDA scripts.

1. Start the migrated VM, then launch the notebook container:

   ```sh
   infra/brev/scripts/notebook INSTANCE
   brev open INSTANCE code --dir /home/ubuntu/workspace
   ```

2. In VS Code, run **Dev Containers: Reopen in Container**. The committed
   `.devcontainer/devcontainer.json` selects the `jupyter` service and opens
   `/workspace`.
3. Open an `.ipynb` file and choose the container Python kernel once. It is
   `/usr/bin/python` and includes the NGC image's CUDA-enabled PyTorch.

Use the browser route in the [onboarding guide](onboarding.md#run-jupyterlab)
when you prefer the full JupyterLab UI.

### Extension cache lifecycle

The Dev Container configuration persists VS Code's extension installation and
download cache in the `gpu-fundamentals-vscode-extensions` and
`gpu-fundamentals-vscode-extension-cache` Docker volumes. The first connection
downloads Python, Jupyter, Pylance, and their dependencies; later rebuilds reuse
those volumes instead of downloading them again.

The volumes are retained when the notebook container is recreated and while the
Brev VM is stopped. To deliberately reset them on the VM, run:

```sh
docker volume rm \
  gpu-fundamentals-vscode-extensions \
  gpu-fundamentals-vscode-extension-cache
```

Only reset the volumes to force a clean extension install; the next Dev
Container connection will need to download the extensions again.
