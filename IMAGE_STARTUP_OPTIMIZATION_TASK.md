# Task: Minimize GPU workspace startup time by workload

- [ ] Make the default fundamentals workspace use the fastest validated provider image, and reserve project-owned images for workloads that require additional pinned tools.

The initial benchmark is documented in [STARTUP_BENCHMARK_RESULTS.md](STARTUP_BENCHMARK_RESULTS.md). It exposed separate SSH/GPU readiness milestones and substantial host-to-host variability; a direct official-template comparison remains before changing the default.

## Decision

Do not require a project-owned image for basic native CUDA or PyTorch exercises when a provider-maintained image already supplies the required toolchain and secure SSH startup.

Use three declarative workload classes:

1. `basics-cuda` uses an official RunPod CUDA development image, pinned by digest. It needs SSH, Git, Python, `nvidia-smi`, `nvcc`, a C++ compiler, CMake, and Ninja. It does not need PyTorch, Triton, or Nsight by default.
2. `basics-pytorch` uses an official RunPod PyTorch image, pinned by digest. It needs SSH, Python, NumPy, PyTorch, and a working CUDA tensor operation. It does not need `nvcc`, Triton, or Nsight unless the selected exercise requires them.
3. `performance-full` uses the project-owned image with native CUDA, PyTorch, Triton, Nsight Compute, and Nsight Systems.

Keep the CLI configuration-free: `./gpu up` selects `basics-cuda`, while `./gpu up basics-pytorch` and `./gpu up performance-full` select the other declarative profiles.

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

RunPod's official `runpod/base` CUDA variants already use NVIDIA CUDA cuDNN development images and provide OpenSSH, `/start.sh`, build tools, Git, CMake, Python, and workspace-aware caches. An official image is also more likely to have reusable layers on RunPod hosts than a private project image, although host placement and cache residency are not guaranteed.

References:

- [RunPod base images](https://hub.docker.com/r/runpod/base/tags)
- [RunPod container sources](https://github.com/runpod/containers/tree/main/official-templates/base)
- [RunPod Pod templates](https://docs.runpod.io/pods/templates/overview)
- [RunPod image caching and immutable-tag guidance](https://docs.runpod.io/tutorials/introduction/containers/docker-commands)

## Fast-path design

### `basics-cuda` default

- Select a stable official `runpod/base` CUDA development release after validating it on the target Ampere and Blackwell GPUs.
- Resolve and commit its immutable `linux/amd64` digest instead of using `latest` or a release-candidate tag directly.
- Use the smallest validated ephemeral container disk; begin testing at 20 GB and increase only if image extraction or compilation requires it.
- Keep persistent volume size at zero.
- Preserve only port `22/tcp` unless an exercise explicitly needs Jupyter or an HTTP service.
- Use the RunPod image's existing `/start.sh` SSH behavior rather than replacing its entrypoint.
- Validate `nvidia-smi`, `nvcc --version`, compilation, and execution of the tracked CUDA hello program.

Expected workflow:

```text
./gpu up
  -> Terraform selects the basics-cuda profile
  -> RunPod starts its official digest-pinned CUDA image
  -> CLI waits for SSH and runs the native CUDA smoke test
  -> workspace is ready for Zed, SSH, or gpu run
```

### `basics-pytorch`

- Select a stable official `runpod/pytorch` image and pin its digest.
- Validate Python, NumPy, PyTorch, `torch.cuda.is_available()`, and a small CUDA tensor operation.
- Do not install PyTorch again in a derived image.
- Do not include model weights or datasets in the image.

### `performance-full`

- Retain the current project image for profiling and cross-stack exercises.
- Move changing OCI version and revision labels after large dependency layers so a source-only commit does not invalidate reusable installation layers.
- Consider separate `native-profiling` and `pytorch-triton-profiling` targets only if measurements show that the full profile is too slow.

## Implementation plan

1. Add `basics-cuda`, `basics-pytorch`, and `performance-full` profile directories with provider-specific Terraform variable files.
2. Make `basics-cuda` the CLI default without adding image, disk, or tool configuration to the script.
3. Generalize RunPod validation so each profile can declare an appropriate container disk instead of enforcing the current global 40 GB minimum.
4. Permit approved public provider images only when pinned by digest; continue rejecting `latest` and other floating references.
5. Make readiness tests workload-aware:
   - `basics-cuda`: SSH, GPU visibility, compile, execute.
   - `basics-pytorch`: SSH, GPU visibility, import, CUDA tensor operation.
   - `performance-full`: existing complete image smoke test.
6. Verify that the official images accept the registered RunPod SSH key and work with the generated `gpu-runpod` alias and Zed Remote Development.
7. Move mutable OCI labels to the final layer of the project Dockerfile and confirm unchanged dependency layers retain their digests between source-only commits.
8. Document which exercises require each profile and provide a clear error when a command requires a tool absent from the selected profile.

## Startup benchmark

For every candidate, record at least three cold attempts and three likely warm attempts using the same GPU type and cloud tier:

- Terraform apply start and completion.
- Endpoint assignment.
- First successful SSH command.
- Completion of the profile-specific GPU smoke test.
- Zed remote workspace readiness.
- Image reference and digest, GPU host, datacenter, and whether the attempt appeared cached.

Compare:

1. Official RunPod CUDA base pinned by digest.
2. Official RunPod PyTorch image pinned by digest.
3. Project-owned `performance-full` image pinned by digest.

Treat measured SSH-ready time as the primary result. Image size is explanatory evidence, not the success metric, because host cache state and placement can dominate startup.

## When we should own an image

Create or retain a project image only when at least one condition is true:

- An exercise requires packages or exact versions absent from the provider image.
- Installing dependencies after every Pod launch is slower than pulling the added immutable layers.
- The same environment must behave consistently across RunPod, GCP, and another provider.
- Security scanning, provenance, or a software bill of materials must cover the complete environment we execute.
- Provider-image updates would otherwise change benchmark results without a repository change.

Do not create a custom image merely to add source code, datasets, aliases, or workload configuration. Synchronize source separately, download public data on demand, and keep provider and workload selection declarative.

## Acceptance criteria

- `./gpu up` provisions the digest-pinned `basics-cuda` profile with no persistent volume.
- The default workspace accepts key-only SSH and becomes usable without interactive package installation.
- The tracked CUDA fundamentals program compiles and runs successfully.
- `./gpu up basics-pytorch` successfully performs a PyTorch CUDA operation without project-owned image layers.
- `./gpu up performance-full` retains all existing compiler, framework, Triton, and profiler validation.
- The median SSH-ready time for `basics-cuda` is lower than the project-owned full image under comparable tests.
- `./gpu down` destroys every ephemeral Pod and leaves no billable storage.
- Documentation states that official-image cache residency is an optimization, not a guarantee.

## Out of scope

- Persistent datasets or model volumes.
- Baking repository source into images.
- Making Mutagen the default workflow.
- Assuming that a template reserves capacity or guarantees a cached host.
