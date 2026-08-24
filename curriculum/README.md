# Curriculum

Each lecture lives directly in this directory. Lecture code is kept with the
lesson, and generated profiles, traces, plots, and other run output belong in
that lesson's `artifacts/` directory.

## Run on Brev

From the repository root on your local machine, create a qualifying VM,
synchronize the workspace, and run the smoke check:

```sh
brev create gpu-profiling --min-vram 48 --min-capability 8.9 --min-disk 200 --max-boot-time 10 --stoppable --sort price --dry-run
infra/brev/scripts/sync-source gpu-profiling
infra/brev/scripts/smoke gpu-profiling
```

Then open a shell. Run every exercise in the pinned NGC PyTorch container;
the VM itself is only the host for that container.

```sh
brev shell gpu-profiling
cd /home/ubuntu/workspace

# Python and PyTorch exercises
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pt_profiler.py'

# Inline C++ and CUDA extension exercises
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python hello_load_inline.py'
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python load_inline.py'

# Numba exercise (the NGC image must include numba)
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python numba_square.py'
```

## Triton square benchmark and Nsight Compute

Run the Triton square correctness check and performance benchmark with a
headless Matplotlib backend. The plot is saved beneath `artifacts/` rather
than trying to display on the VM:

```sh
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm \
  -e MPLBACKEND=Agg pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001/artifacts && python ../triton_square.py'
```

Capture one launch of the Triton kernel with Nsight Compute. This produces
`artifacts/triton-square.ncu-rep`, which can be opened locally with the
Nsight Compute desktop application:

```sh
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm --cap-add SYS_ADMIN pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && \
   ncu --target-processes all --kernel-name regex:square_kernel --launch-count 1 --page details \
       -o artifacts/triton-square python triton_square.py'
```

From the local machine, retrieve all generated lecture artifacts:

```sh
mkdir -p curriculum/gpu-mode-lecture-001/artifacts
brev copy gpu-profiling:/home/ubuntu/workspace/curriculum/gpu-mode-lecture-001/artifacts/ \
  curriculum/gpu-mode-lecture-001/artifacts/
```

## Other profilers

Save profiling output under `artifacts/`:

```sh
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && \
   nsys profile --force-overwrite true -o artifacts/pytorch-square python pytorch_square.py'
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm --cap-add SYS_ADMIN pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && \
   ncu --target-processes all -o artifacts/load-inline python load_inline.py'
```

Stop compute when finished with `brev stop gpu-profiling`; delete a temporary
instance with `brev delete gpu-profiling`.

## Lecture sources and slides

The source for these lectures, including the PDF slides, is the
[CUDA MODE lectures repository](https://github.com/gpu-mode/lectures),
specifically [Lecture 001](https://github.com/gpu-mode/lectures/tree/main/lecture_001).
The copied source, commit, license, and retrieval date are recorded in
[UPSTREAM.md](UPSTREAM.md).
