# GPU MODE Lecture 001

This directory keeps our practice notes and runnable reference material for GPU MODE's first CUDA lecture. See the original
[CUDA MODE lectures repository](https://github.com/gpu-mode/lectures) and its
[Lecture 001 materials](https://github.com/gpu-mode/lectures/tree/main/lecture_001),
including the upstream slides. The scripts introduce PyTorch operations and
profiling, PyTorch inline C++/CUDA extensions, Triton, and Numba. Their source
and license are recorded in [UPSTREAM.md](UPSTREAM.md).

## Prerequisites

Use the profiling target in `infra/brev/AGENTS.md` and the upstream NVIDIA NGC PyTorch workload.
The host VM owns SSH and the synchronized workspace; the container provides
CUDA, PyTorch, and the Nsight tools. See [`docs/brev/onboarding.md`](../../../docs/brev/onboarding.md).

## Start a remote node

From the repository root on the local machine:

```sh
brev create gpu-profiling --min-vram 48 --min-capability 8.9 --min-disk 200 --max-boot-time 10 --stoppable --sort price --dry-run
infra/brev/scripts/sync-source gpu-profiling
infra/brev/scripts/smoke gpu-profiling
```

At the end of a session, stop compute. `/home/ubuntu/workspace` persists
between Brev stops, but capacity can be unavailable when an instance restarts:

```sh
brev stop gpu-profiling
```

When the exercise is complete, delete the test instance with `brev delete gpu-profiling`.

## Verify the environment

Open a shell on the VM, then enter this directory:

```sh
brev shell gpu-profiling
cd /home/ubuntu/workspace/curriculum/brev/gpu-mode-lecture-001
python -c 'import matplotlib, numba, torch, transformers, triton; assert torch.cuda.is_available(); print(torch.cuda.get_device_name())'
nvcc --version
ncu --version
nsys --version
```

## Run the exercises

Run the scripts in this order so each new tool is introduced separately:

```sh
cat 01-pytorch-square.md
python pytorch_square.py
python pt_profiler.py
python hello_load_inline.py
python load_inline.py
python numba_square.py
python triton_square.py
```

Start with the learner-owned [Exercise 01 guide](01-pytorch-square.md). It
explains the baseline, what to inspect in the PyTorch profiler, and the
questions to answer before implementing an inline CUDA kernel.

The first inline-CUDA and Triton executions compile and populate caches, so
they are intentionally slower. `triton_square.py` writes its benchmark output
and plot files in the current directory. `test.py` additionally downloads the
public `bert-base-cased` model on its first run.

## Collect profiler evidence

Use a separate output prefix for each tool. Nsight Compute must follow child
processes when profiling a PyTorch JIT extension:

```sh
mkdir -p artifacts
nsys profile --force-overwrite true -o artifacts/pytorch-square python pytorch_square.py
ncu --target-processes all -o artifacts/load-inline python load_inline.py
```

The copied `nsys_square.py` retains an upstream placeholder call to
`model(inputs)` and is therefore reference material, not a runnable standalone
script. Use `pytorch_square.py` with the `nsys` command above for the first
trace, then write a learner-owned replacement before changing the upstream
copy.
