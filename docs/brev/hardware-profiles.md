# Brev hardware profiles and replacement

This document records the stable requirements for our GPU environments. It is
not a live inventory: provider capacity, instance identity, and price change
over time and must not be committed to Git.

## Live inventory

Use Brev and the provider console to see what exists now:

```sh
brev ls
brev ls --json
```

`brev ls` shows the workspace name, lifecycle state, machine type, and GPU.
Use the Brev Console for current hourly price, storage charges, billing alerts,
and provider-specific details. Do not copy instance IDs, price quotes, or
provider resource IDs into tracked files, shell logs, or benchmark artifacts.

## Supported profiles

| Profile | Use | Required capability | Replacement criteria |
| --- | --- | --- | --- |
| Fundamentals | Curriculum exercises and small kernel captures | One 16–24 GB GPU, compute capability 8.0+, 100 GB disk | Stoppable, boots within 7 minutes, within the fundamentals price ceiling |
| Profiling | Nsight Compute, larger shapes, and repeatable performance work | One 48 GB GPU, compute capability 8.9+, 200 GB disk | Stoppable, boots within 10 minutes, within the profiling price ceiling |

The current session's GPU model is evidence about that run, not a permanent
pin. Record the GPU name, compute capability, CUDA/PyTorch/Triton versions,
and benchmark shape beside its generated artifact so later results can be
interpreted correctly.

## Choose a comparable replacement

Use the profile's live search rather than assuming a previously available
machine will return. Review the results manually before a billable action:

```sh
# Fundamentals: comparable to a single modest, CUDA-capable GPU
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 \
  --max-boot-time 7 --stoppable --sort price

# Profiling: comparable to a 48 GB, Ada-or-newer profiling GPU
brev search --json --min-vram 48 --min-capability 8.9 --min-disk 200 \
  --max-boot-time 10 --stoppable --sort price
```

For a valid replacement, match the profile before optimizing price: GPU count,
VRAM, compute capability, disk, and boot-time constraints all matter. Then
select the cheapest currently available result within the applicable price
ceiling. The exact ceilings and approval rules live in
[`infra/brev/AGENTS.md`](../../infra/brev/AGENTS.md).

## Capture reproducibility metadata

Run this inside the pinned NGC container at the start of a benchmark session
and save the output next to the session's generated artifacts:

```sh
nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
python - <<'PY'
import torch
import triton

print(f"torch={torch.__version__}")
print(f"triton={triton.__version__}")
print(f"cuda={torch.version.cuda}")
print(f"gpu={torch.cuda.get_device_name(0)}")
print(f"compute_capability={torch.cuda.get_device_capability(0)}")
PY
```

This metadata explains why benchmark numbers or NCU counters differ across
runs. It contains software and hardware characteristics, not cloud-account or
provider resource identifiers.
