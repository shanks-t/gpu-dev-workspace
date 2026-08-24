# Nsight Compute on a Brev NGC VM

This runbook captures the validated workflow for profiling the Lecture 001
Triton square kernel. The Brev VM supplies SSH and persistent workspace
storage; the pinned NGC PyTorch container supplies CUDA, Triton, and Nsight
Compute.

## Start and synchronize

Use an approved profiling VM. Starting a VM incurs provider charges, so set
the watchdog immediately after it becomes available.

```sh
brev start gpu-profiling
brev refresh
infra/brev/scripts/sync-source gpu-profiling
infra/brev/scripts/watchdog gpu-profiling 180 --confirm-watchdog
```

If the NGC image has not previously been authenticated on this VM, run
`infra/brev/scripts/ngc-login gpu-profiling` from the Mac before launching the
container.

## Generate the Triton performance plot

Run this on the VM after `brev shell gpu-profiling`. `MPLBACKEND=Agg` renders
the plot without a GUI and writes it to the mounted workspace.

```sh
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm \
  -e MPLBACKEND=Agg pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001/artifacts && python ../triton_square.py' \
  2>&1 | tee curriculum/gpu-mode-lecture-001/artifacts/triton-benchmark.log
```

This produces `square() performance.png` and `square() performance.csv` in
`curriculum/gpu-mode-lecture-001/artifacts/`.

## Capture an Nsight Compute report

Run NCU in the same NGC container. `SYS_ADMIN` is required because NVIDIA
drivers restrict GPU performance-counter access by default. It is scoped to
this one container invocation; it does not change the VM driver's global
policy.

```sh
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm \
  --cap-add SYS_ADMIN pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001/artifacts && \
   ncu --target-processes all --kernel-name regex:square_kernel --launch-count 1 \
       -o triton-square-ncu python ../triton_square.py' \
  2>&1 | tee curriculum/gpu-mode-lecture-001/artifacts/triton-square-ncu.log
```

The resulting `triton-square-ncu.ncu-rep` contains the metrics for the first
matching generated Triton kernel. The Python script continues through its
benchmark after that capture; `--launch-count 1` limits NCU collection, not
the application's work.

## Retrieve and review

From the Mac, copy the report and supporting outputs into the local lesson
artifacts directory:

```sh
mkdir -p curriculum/gpu-mode-lecture-001/artifacts
brev copy gpu-profiling:/home/ubuntu/workspace/curriculum/gpu-mode-lecture-001/artifacts/ \
  curriculum/gpu-mode-lecture-001/artifacts/
open 'curriculum/gpu-mode-lecture-001/artifacts/square() performance.png'
open -a 'NVIDIA Nsight Compute' \
  curriculum/gpu-mode-lecture-001/artifacts/triton-square-ncu.ncu-rep
```

## Finish

Stop the VM when the reports are copied. The watchdog is only a backup.

```sh
brev stop gpu-profiling
```

If NCU reports `ERR_NVGPUCTRPERM`, confirm that the command includes
`--cap-add SYS_ADMIN`. [NVIDIA documents this error](https://docs.nvidia.com/nsight-compute/ProfilingGuide/)
as missing permission to access GPU performance counters.
