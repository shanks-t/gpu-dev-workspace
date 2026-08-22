# Tasks

## Build a repeatable RunPod development image and template

- [ ] Replace the generic RunPod image with a versioned development image and Terraform-managed Pod template.

### Why

The first live test provisioned a Pod quickly, but the selected image did not contain the complete performance toolchain. PyTorch and Triton could use the GPU, while `nvcc`, NumPy, and Nsight Systems were missing; the existing check did not independently establish whether Nsight Compute was usable. Installing tools after every ephemeral launch would be slow, inconsistent, and difficult to reproduce.

A RunPod template makes container settings repeatable, but it does not reserve a GPU or guarantee faster host allocation. Most of the startup improvement should come from a tested Docker image with dependencies already installed. The template should package the image reference, SSH port, environment variables, startup command, and container disk configuration. Workload profiles should continue to select GPU hardware, cloud tier, and persistence.

### Implementation

1. Add a `linux/amd64` Dockerfile based on a pinned CUDA development image compatible with the target Ampere and Blackwell GPUs.
2. Install and pin the required tools:
   - CUDA compiler and development headers (`nvcc`).
   - Nsight Compute (`ncu`) and Nsight Systems (`nsys`).
   - PyTorch with CUDA, Triton, and NumPy.
   - CMake, Ninja, Git, OpenSSH, and utilities required by Zed Remote Development.
3. Keep source code outside the image. The image supplies the toolchain; Git or workspace synchronization supplies the code being edited.
4. Add an image smoke test that fails unless every required command and Python import is available and a CUDA operation succeeds.
5. Build and test the image for `linux/amd64`, including builds initiated from an Apple Silicon Mac.
6. Publish it to GHCR with an immutable semantic-version or commit-derived tag. Do not use `latest`.
7. Manage a private `runpod_template` resource with Terraform and pass its ID to `runpod_pod`.
8. Keep provider-specific hardware and lifecycle choices in `profiles/<profile>/runpod.tfvars`; do not put GPU selection into the template.
9. Preserve the ephemeral default. The template must not create a persistent volume unless the selected profile enables one.
10. Record timestamps for Terraform creation, endpoint assignment, SSH readiness, image initialization, and Zed readiness so cold-start improvements can be measured rather than assumed.

### Acceptance criteria

- A new ephemeral Pod requires no interactive package installation.
- `nvidia-smi`, `nvcc`, `ncu`, `nsys`, Python, NumPy, PyTorch, and Triton pass automated validation.
- A CUDA C++ smoke test and a PyTorch CUDA smoke test both run successfully.
- Terraform owns the RunPod template and uses an immutable image tag.
- The same profile produces the same software environment on repeated launches.
- Cold- and warm-start measurements are documented.
- `gpu down` still destroys all resources for the ephemeral profile.

### Follow-up efficiency work

- Prefer currently available compatible GPUs rather than assuming the cheapest catalog entry has capacity.
- Keep image layers stable and the final image no larger than necessary so registry and host caching remain effective.
- Add CI image builds, vulnerability scanning, and a software bill of materials.
- Decide whether large public datasets should be downloaded on demand, baked into a specialized image, or stored in provider-independent object storage.
