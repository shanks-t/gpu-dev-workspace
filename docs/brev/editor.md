# Edit locally with Zed, run on the VM

Zed is the recommended editor. Keep the repository open locally in Zed, then
sync changes to the Brev VM and run GPU code there in the pinned NGC container.
The Mac environment is for editing feedback only; do not run GPU lesson code
with the Mac interpreter.

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

## Edit, sync, run, repeat

1. Start or choose `INSTANCE` with the [GPU VM selection guide](instance-selection.md).
2. Make changes locally in Zed.
3. Sync the working tree to the VM, then open its shell:

   ```sh
   infra/brev/scripts/sync-source INSTANCE
   brev shell INSTANCE
   ```

4. On the VM, run the exercise through NGC:

   ```sh
   cd /home/ubuntu/workspace
   docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
     'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
   ```

After the next edit in Zed, repeat the sync and run steps. `sync-source` is
the normal incremental `rsync --delete` path; it refreshes the Brev connection
details before copying files.

## VS Code notebooks in the NGC container

For interactive notebooks, use VS Code Remote SSH to reach the Brev VM, then
reopen the repository in its NGC Dev Container. This puts the VS Code Python
and Jupyter extensions in the same environment as CUDA scripts.

1. Start and sync the VM, then launch the notebook container:

   ```sh
   infra/brev/scripts/sync-source INSTANCE
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
