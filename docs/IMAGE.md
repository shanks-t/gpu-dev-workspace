# GPU Development Image

The RunPod workspace uses a project-owned `linux/amd64` image instead of installing development tools after every launch. Application source is not baked into the image; Git seeding or a future synchronization workflow supplies the working tree.

## Pinned toolchain

Image version `0.1.0` contains:

| Component | Version |
| --- | --- |
| Ubuntu | 24.04 |
| CUDA toolkit and `nvcc` | 13.0.2 |
| Nsight Compute CLI | 2025.3.1 |
| Nsight Systems | 2025.6.3 |
| Python | 3.12 |
| NumPy | 2.3.5 |
| PyTorch | 2.9.1+cu130 |
| Triton | 3.5.1 |
| GPU MODE Lecture 001 extras | Numba 0.67.0, Matplotlib 3.11.1, Transformers 5.15.1 |

The NVIDIA CUDA base is pinned by its `linux/amd64` manifest digest. Apt packages, Python packages, and direct Python dependencies are pinned explicitly. Password SSH is disabled; the startup script generates unique host keys and installs RunPod's `PUBLIC_KEY` as root's authorized key.

## Build on Apple Silicon

Start Docker Desktop, then run:

```sh
make image
make image-smoke
```

The build script always targets `linux/amd64`, which is the RunPod Pod architecture. The image build validates command availability, package imports, and exact versions under emulation. CUDA compilation is deliberately deferred to a native-amd64 runner because `nvcc` can crash under QEMU on Apple Silicon.

The GitHub Actions workflow performs the native compilation check before publishing. A live GPU remains necessary to execute CUDA and PyTorch kernels.

## Publish to GHCR

The workflow publishes two forms of immutable tag and never publishes `latest`:

- Every image build: `sha-<full-git-commit>`.
- A matching `image-v0.1.0` Git tag: `0.1.0` and the commit-derived tag.

Before the first publish:

1. Create the GitHub repository and set it as this repository's `origin`.
2. Push the `main` branch so the workflow can publish with `GITHUB_TOKEN`.
3. Tag the image release only when `image/VERSION` matches:

   ```sh
   git tag image-v0.1.0
   git push origin main image-v0.1.0
   ```

4. Either make the GHCR package public or configure GHCR credentials in RunPod. For a private package, put the resulting RunPod registry-authentication ID in the ignored `infra/runpod/terraform.tfvars` file:

   ```hcl
   container_registry_auth_id = "replace-with-runpod-registry-auth-id"
   ```

The RunPod template itself remains private regardless of package visibility.

## Terraform ownership

Terraform manages `runpod_template.lab`. The template owns:

- The immutable image reference.
- The ephemeral container-disk size.
- TCP port 22.
- Cache environment variables.

The selected workload profile continues to own GPU type, GPU count, cloud tier, interruptibility, and persistent-storage policy. The template contains no volume configuration, so `book-ephemeral` still creates no persistent storage and `gpu down` destroys its Pod.

## Validation

The image exposes one validation command with three levels:

```sh
gpu-image-smoke-test --build    # Commands, imports, and versions; safe under QEMU
gpu-image-smoke-test --compile  # Also compile CUDA; use native linux/amd64
gpu-image-smoke-test --gpu      # Also run CUDA and PyTorch kernels; use a GPU host
```

`gpu up` automatically runs `--gpu` on RunPod and fails before seeding the workspace if any required command, import, compilation, or GPU operation fails.

For a manual live check:

```sh
./gpu up book-ephemeral
./gpu ssh gpu-image-smoke-test --gpu
./gpu down
```

After `down`, confirm `terraform -chdir=infra/runpod state list` has no resources and `./gpu status` reports no managed Pod.

## Startup measurements

Every successful `gpu up` writes `.gpu/startup-runpod.json` with Unix timestamps and elapsed seconds for:

- Terraform readiness.
- Public endpoint assignment.
- SSH readiness.
- Image GPU validation.
- Workspace readiness.
- Zed launch, after `gpu zed` is invoked.

Measure at least one cold start after publishing a new image and one warm start after RunPod has likely cached it. Preserve the JSON files outside `.gpu/` when comparing releases because `.gpu/` is intentionally ignored by Git.
