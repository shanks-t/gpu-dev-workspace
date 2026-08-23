# GPU MODE Lecture 001

This is our runnable copy of GPU MODE's first CUDA lecture. The upstream
scripts introduce PyTorch operations and profiling, PyTorch inline C++/CUDA
extensions, Triton, and Numba. Their source and license are recorded in
[UPSTREAM.md](UPSTREAM.md).

## Prerequisites

The `gpu-mode-lecture-001` profile uses the project-owned `0.1.1` image. It
contains CUDA 13, a C++ compiler, Ninja, PyTorch, Triton, Numba, Matplotlib,
Transformers, Nsight Compute, and Nsight Systems. It must be published to GHCR
and RunPod must have a read-only GHCR registry-authentication ID before the
profile can start.

## Start a remote node

From the repository root on the local machine:

```sh
./gpu up gpu-mode-lecture-001
./gpu zed
```

The profile has a retained 50 GB `/workspace` volume. At the end of a session,
stop compute without discarding JIT build caches or profiler artifacts:

```sh
./gpu down
./gpu status
```

When the exercise is complete, permanently delete the Pod and its retained
volume:

```sh
./gpu cleanup
```

## Verify the environment

Open a shell on the Pod, then enter this directory:

```sh
./gpu ssh
cd /workspace/gpu-dev-workspace/curriculum/gpu-mode-lecture-001
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
