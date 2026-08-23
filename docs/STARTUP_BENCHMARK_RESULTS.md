# RunPod startup benchmark: initial findings

Date: 2026-08-22

## Outcome

This pass established useful startup and readiness behavior, but it did not produce a valid end-to-end performance winner. All benchmark Pods and templates were destroyed, Terraform state is empty, and no persistent volumes were created.

The strongest result is that a RunPod-owned image can reach SSH quickly, but it is not consistently fast merely because it is published by RunPod. Host placement, cache state, endpoint assignment, GPU initialization, and the exact template/image reference all affect time to a usable development environment.

## Candidates

All trials requested one on-demand Community RTX 3090 with a 40 GB ephemeral container disk.

| Profile | Image | Registry size | Observed process time | Result |
| --- | --- | ---: | ---: | --- |
| `basics-cuda` | `runpod/base` CUDA 13, digest pinned | 6.94 GB | About 81 seconds | SSH became available, but the original one-shot GPU validation failed before usable-GPU readiness was distinguished from SSH readiness. |
| `basics-pytorch` | `runpod/pytorch` 2.8 / CUDA 12.8, digest pinned | 10.56 GB | About 24 seconds | SSH became available quickly; PyTorch reported that CUDA was not initialized yet. |
| `profiling-nvidia` | `runpod/nvidia-pytorch` 25.11, digest pinned | 9.78 GB | About 206 seconds | SSH became available, but the initial silent tool check failed. The trial did not establish whether `nvcc`, `ncu`, or `nsys` was the missing command. |
| `basics-cuda`, second host | Same digest-pinned RunPod base | 6.94 GB | More than 10 minutes | RunPod rented the Pod at $0.34/hour but never assigned a public IP, SSH port, or GPU details before the readiness timeout. |
| `performance-full` | Private project GHCR image | Not measured | Not run | RunPod has no configured GHCR registry credential, and the package is not publicly readable. |

Process time includes Terraform creation, readiness attempts, and teardown overhead. It is not a clean image-pull measurement. Raw local logs and failure records remain under the ignored `.gpu/benchmarks/` directory.

## What we learned

### Official images can be fast, but are not a guarantee

The official PyTorch image accepted SSH in less than half a minute in one trial. The smaller official CUDA base then failed to expose an endpoint within ten minutes on another host. Image size alone did not predict startup time.

RunPod image ownership does not guarantee that every Community host has the image cached. It may still improve the probability of cache reuse, especially when using the exact image tag and official template, but this pass used project-managed templates and digest-form image references.

### SSH readiness and GPU readiness are separate milestones

The CLI originally treated the first successful SSH command as sufficient to run CUDA checks. PyTorch demonstrated that SSH can be ready before the container can initialize CUDA. The CLI now waits up to two additional minutes for `nvidia-smi -L` before running workload-specific validation.

The benchmark should continue to report these milestones separately:

1. Terraform resource creation.
2. Endpoint assignment.
3. SSH command success.
4. `nvidia-smi` GPU readiness.
5. Workload smoke-test completion.
6. Workspace synchronization or Zed readiness.

### The official template is a different test from the official image

RunPod currently exposes the official template `runpod-torch-v280`, backed by `runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404`. It declares a 30 GB container disk and a 50 GB `/workspace` volume.

The initial benchmark deliberately did not use it because the project required no persistent volume by default. That restriction can now be changed. A direct official-template trial is the most useful next benchmark because RunPod may optimize placement or caching for the template differently from a user-managed template that references the same image.

A persistent volume can improve iterative development by retaining source, caches, and build artifacts, but it continues to incur storage charges after compute stops. The CLI must therefore make retained storage visible in `status`, use `stop` instead of `destroy` when appropriate, and retain an explicit `cleanup` operation.

### The project image comparison remains unresolved

The project image cannot be pulled by RunPod until one of these is done:

- Make the GHCR package publicly readable.
- Create a read-only GHCR package token, save it as RunPod registry authentication, and set `container_registry_auth_id` locally.

Do not grant RunPod write access to GHCR. A read-only package credential is sufficient.

## Changes made during the benchmark

- Added digest-pinned candidate profiles for CUDA, PyTorch, NVIDIA profiling, and the project image.
- Added profile-specific validation instead of assuming every image contains `gpu-image-smoke-test`.
- Added a teardown-safe benchmark harness that destroys template-only partial applies as well as Pods.
- Normalized the optional registry-auth value to work around RunPod Terraform provider v1.0.8 returning an empty string instead of `null`.
- Added a distinct GPU-readiness wait after SSH readiness.
- Confirmed after every pass that the account had no Pods or project templates and Terraform had no managed resources.

## Recommended next experiment

Run only two candidates, with two trials each:

1. The official `runpod-torch-v280` template, accepting its 50 GB retained volume for the experiment.
2. The project `performance-full` image after configuring read-only GHCR access.

For the official template, validate:

```text
nvidia-smi
nvcc --version
ncu --version
nsys --version
python -c 'import torch; assert torch.cuda.is_available()'
```

This will answer the practical question: whether the official template is a sufficiently complete and faster default for fundamentals, and whether the custom image is worth retaining for profiling.

Do not run a larger cold/warm matrix until both candidates complete the same end-to-end smoke test. Repeating invalid readiness checks would spend money without producing comparable data.
