# Editor support

Edit the repository locally. The local environment provides syntax, type, and
hover support; GPU execution remains in the pinned NGC container on the Brev
VM. Do not execute GPU lesson code with the Mac interpreter.

## Local Zed setup (recommended)

Each lecture has a self-contained `uv` project. It provides macOS-compatible
libraries for editor feedback, while CUDA execution, Triton kernels, and
profiling run remotely.

```sh
cd curriculum/gpu-mode-lecture-001
uv sync --python 3.11
```

Open the repository in Zed and select
`curriculum/gpu-mode-lecture-001/.venv` as the Python toolchain. Zed's
basedpyright server can then resolve PyTorch, NumPy, Numba, Matplotlib, and
Transformers for hover information and static feedback.

Triton is a Linux-only `gpu` extra, so it is not a supported macOS runtime.
Its source still receives Python syntax highlighting locally; run Triton code
on the GPU VM.

## VS Code

`brev open INSTANCE code` opens the Brev-managed Remote SSH workspace. Use it
when you need to inspect or edit files on `/home/ubuntu/workspace`, then run
the code in the NGC container from a terminal:

```sh
brev open gpu-profiling code
brev shell gpu-profiling
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
```

The repository no longer ships a Dev Container or a Zed-specific SSH
container. Those paths are intentionally unsupported; use the compose command
above for all GPU execution. If hover information is missing locally, restart
the editor's Python language server and confirm it uses the lecture `.venv`.
