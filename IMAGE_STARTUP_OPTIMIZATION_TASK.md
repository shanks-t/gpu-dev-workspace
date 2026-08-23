# Task: Minimize GPU workspace startup time by workload

- [ ] Make the default fundamentals workspace use the fastest validated provider image, and reserve project-owned images for workloads that require additional pinned tools. (Profile wiring and exercise routing are complete; live comparative trials remain.)

The initial benchmark is documented in [STARTUP_BENCHMARK_RESULTS.md](STARTUP_BENCHMARK_RESULTS.md). It exposed separate SSH/GPU readiness milestones and substantial host-to-host variability; a direct official-template comparison remains before changing the default.

## Decision

Do not choose the default from image size or registry ownership. Choose it from repeatable time-to-usable-GPU measurements after each candidate passes the same workload checks.

The next comparison has only two candidates:

1. `official-fundamentals` uses RunPod's official `runpod-torch-v280` template, including its 30 GB container disk and 50 GB `/workspace` volume.
2. `performance-full` uses the project-owned image with native CUDA, PyTorch, Triton, Nsight Compute, and Nsight Systems.

A retained volume is now allowed for the default workflow. If the official template wins, `./gpu down` must stop compute and clearly report continuing storage charges; `./gpu cleanup` must permanently remove the Pod and retained storage.

Keep the CLI configuration-free. Do not change what bare `./gpu up` selects until the two candidates complete equivalent validation and timing trials.

## Why

The current project-owned image is 13.75 GB unpacked. Its largest installed components are approximately:

| Component | Size | Fundamentals requirement |
| --- | ---: | --- |
| CUDA 13 development toolkit | 5.0 GB | Native CUDA only |
| PyTorch NVIDIA libraries | 2.6 GB | PyTorch only |
| Nsight Compute | 1.3 GB | Profiling only |
| PyTorch | 1.2 GB | PyTorch only |
| Nsight Systems | 1.1 GB | Profiling only |
| Triton | 594 MB | Triton exercises only |

The initial benchmark showed that a RunPod-owned image can become SSH-ready quickly but is not consistently fast across Community hosts. One official PyTorch trial reached SSH in about 24 seconds, while a smaller RunPod CUDA-base trial on another host never received an endpoint within ten minutes. Host placement, cache state, and GPU initialization matter more than image size alone.

RunPod's official PyTorch 2.8 template is the best remaining fast-path candidate because it tests RunPod's complete maintained template rather than a user-managed template that merely references a RunPod image. The project image remains the reproducible full-toolchain candidate.

References:

- [RunPod base images](https://hub.docker.com/r/runpod/base/tags)
- [RunPod container sources](https://github.com/runpod/containers/tree/main/official-templates/base)
- [RunPod Pod templates](https://docs.runpod.io/pods/templates/overview)
- [RunPod image caching and immutable-tag guidance](https://docs.runpod.io/tutorials/introduction/containers/docker-commands)

## Completed work

- [x] Measure initial digest-pinned RunPod base, PyTorch, and NVIDIA-PyTorch candidates.
- [x] Record the results and confirm that all Pods, templates, and Terraform resources were removed.
- [x] Add profile-specific validation instead of requiring the project image's smoke-test command everywhere.
- [x] Separate endpoint, SSH, and usable-GPU readiness; retry `nvidia-smi -L` after SSH succeeds.
- [x] Add a teardown-safe harness that destroys Pod-plus-template and template-only partial applies.
- [x] Add immutable candidate profiles without changing the current CLI default.

## Recommended next steps

1. [x] Add an `official-fundamentals` profile that references existing template ID `runpod-torch-v280` instead of creating a user-managed RunPod template.
2. [x] Model the official template's 50 GB `/workspace` volume declaratively and verify exactly which resource Terraform owns.
3. [x] Update lifecycle behavior for a retained-volume default:
   - `gpu down` stops compute and preserves the workspace.
   - `gpu status` reports compute state, persistent-storage state, and continuing storage cost.
   - `gpu cleanup` requires confirmation and permanently deletes compute and retained storage.
4. [ ] Create a read-only GHCR package credential, register it with RunPod, and store only its RunPod registry-authentication ID in ignored local Terraform configuration.
5. [ ] Confirm RunPod can pull the immutable `performance-full` image without granting package-write access.
6. [x] Move mutable OCI version and revision labels after the project image's large dependency layers to preserve layer reuse across source-only commits.
7. [ ] Run one qualifying trial per candidate before repeating anything. A qualifying trial must pass every readiness and workload check below.
8. [ ] Run one additional trial per qualifying candidate using the same RTX 3090 Community configuration.
9. [ ] Compare complete time-to-ready results and choose the bare `./gpu up` default.
10. [x] Document provisional exercise routing for `official-fundamentals` and `performance-full`; finalize it after the qualifying trials.

Do not run a larger cold/warm matrix until both candidates pass once. Failed or unequal smoke tests are not comparable benchmarks.

## Required validation

Both candidates must pass the same fundamentals boundary:

- Key-only SSH through the generated `gpu-runpod` alias.
- Successful `nvidia-smi` execution, not merely command presence.
- `nvcc` compilation and execution of the tracked native CUDA example.
- NumPy and PyTorch imports.
- A PyTorch CUDA tensor operation.
- `ncu` and `nsys` command/version probes, with missing profilers recorded as an explicit capability difference rather than a silent failure.
- Repository workspace access through SSH and Zed Remote Development.

`performance-full` must additionally pass Triton and the existing complete image smoke test.

## Benchmark protocol

Record these milestones for each trial:

1. Terraform start and resource creation.
2. Endpoint assignment.
3. First successful SSH command.
4. First successful `nvidia-smi -L` command.
5. Completion of native CUDA and PyTorch smoke tests.
6. Workspace seed or synchronization completion.
7. Zed remote-workspace launch readiness.

Also record image/template identity, GPU host, datacenter, compute price, retained-volume configuration, and teardown result. Treat complete GPU-and-workspace readiness as the primary metric. SSH-ready time and image size are diagnostic evidence only.

## Default-selection rules

- Select `official-fundamentals` if it passes the required tool boundary and has meaningfully better or comparable complete readiness time.
- Select `performance-full` if the official template is missing tools needed by early exercises or its apparent startup advantage is not repeatable.
- Keep `performance-full` as an explicit advanced profile even if the official template becomes the default.
- Consider a thin project image derived from the official RunPod image only if it can add missing tools while preserving a measured startup advantage.
- Never select a profile because one unusually favorable host was fast.

## When we should own an image

Create or retain a project image only when at least one condition is true:

- An exercise requires packages or exact versions absent from the provider image.
- Installing dependencies after every Pod launch is slower than pulling the added immutable layers.
- The same environment must behave consistently across RunPod, GCP, and another provider.
- Security scanning, provenance, or a software bill of materials must cover the complete environment we execute.
- Provider-image updates would otherwise change benchmark results without a repository change.

Do not create a custom image merely to add source code, datasets, aliases, or workload configuration. Synchronize source separately, download public data on demand, and keep provider and workload selection declarative.

## Acceptance criteria

- Both candidates complete at least two equivalent end-to-end trials.
- The selected default accepts key-only SSH and requires no interactive package installation.
- Native CUDA and PyTorch CUDA fundamentals run successfully on the selected default.
- Missing profiling capabilities are documented and route users to `performance-full` when necessary.
- If the selected default retains a volume, `down`, `status`, and `cleanup` expose and enforce the intended storage lifecycle.
- Final cleanup leaves no unintended Pods, templates, volumes, or Terraform resources.
- The documented choice acknowledges that official-image cache residency and Community host placement are not guaranteed.

## Out of scope

- Baking repository source into images.
- Making Mutagen the default workflow.
- Assuming that a template reserves capacity or guarantees a cached host.
- Optimizing large model or public-dataset storage before the fundamentals workflow is selected.
