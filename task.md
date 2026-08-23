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

## Prove a local-first Mutagen development loop

- [ ] Add opt-in Mutagen synchronization to `gpu up`, validate iterative GPU development and profiling on a live Pod, and guarantee that `gpu down` terminates the session as well as the provider resources.

### Goal

Keep the MacBook repository authoritative while continuously copying saved source changes to the disposable GPU workspace. The proof must cover the complete loop:

```text
local Zed edit -> Mutagen sync -> remote run -> remote profile -> local edit -> rerun -> gpu down
```

Start with `GPU_SYNC=mutagen ./gpu up` as an opt-in experiment. Do not make Mutagen the default until the live acceptance test passes and the interaction with `gpu zed` is explicit. A Mutagen-managed local-first workspace and a remote-first Zed workspace must not write to the same remote tree concurrently.

### Design decisions

1. Use Mutagen's `one-way-safe` mode with the local repository as alpha and the GPU workspace as beta. Local files are authoritative, while unexpected remote modifications become visible conflicts instead of being silently overwritten.
2. Keep synchronization policy in a committed Mutagen configuration file. The CLI should supply only runtime values: provider alias, remote path, Pod or instance identity, and session name.
3. Ignore VCS metadata and machine-local or sensitive files, including:
   - `.git/` and other VCS directories.
   - `.gpu/`, `.DS_Store`, editor caches, Python bytecode, and local virtual environments.
   - `.terraform/`, Terraform state, plans, account-specific `infra/*/terraform.tfvars`, `.env*`, credentials, and private keys.
   - Local build and profiler-output directories when remote-generated artifacts should remain remote until explicitly collected.
4. Continue syncing committed workload profiles under `profiles/`; they are source files, not account secrets.
5. Use a unique session name containing the provider and managed resource ID, such as `gpu-workspace-runpod-<pod-id>`. Record the exact name in ignored local runtime state under `.gpu/`; never terminate sessions using a broad wildcard.
6. Force a Mutagen flush before every CLI-managed remote run. Continuous watching provides low latency, while the flush creates a deterministic save/sync/run boundary.
7. Keep generated profiler reports out of the one-way source session. Retrieve selected `.nsys-rep`, `.ncu-rep`, JSON, and trace files explicitly into `.gpu/artifacts/<provider>/<resource-id>/` so remote output cannot flow back into the source tree unexpectedly.
8. Terminate the Mutagen session before stopping or destroying its remote endpoint. Session termination must not delete files at either endpoint.
9. If Mutagen teardown fails, still perform the provider teardown to stop billing, then report the synchronization cleanup failure clearly. A stale local session must never keep paid compute running.

References: [Mutagen synchronization modes](https://mutagen.io/documentation/synchronization), [ignore configuration](https://mutagen.io/documentation/synchronization/ignores), [version-control guidance](https://mutagen.io/documentation/synchronization/version-control-systems/), and [session lifecycle commands](https://mutagen.io/documentation/introduction/getting-started).

### Phase 1: Add deterministic GPU examples

1. Add a small tracked Python CUDA program, for example `examples/mutagen_smoke.py`, that:
   - Prints an obvious source-version marker such as `sync-version=v1`.
   - Prints the selected GPU and PyTorch/CUDA versions.
   - Runs a deterministic matrix multiplication, synchronizes CUDA, verifies the result, and reports elapsed GPU time.
   - Adds NVTX ranges so Nsight Systems and Nsight Compute can identify setup and compute regions.
2. Keep the existing `cuda/hello.cu` program as the native CUDA compiler/profiler smoke test.
3. Add a shell validation driver under `tests/` or `scripts/` that invokes the public `gpu` interface rather than duplicating SSH paths or session names.
4. Make profiler output names unique per run so validation never mistakes an old report for a newly generated one.

### Phase 2: Add Mutagen lifecycle support

1. Document and preflight the stable macOS installation before provisioning paid compute:

   ```sh
   brew install mutagen-io/mutagen/mutagen
   mutagen version
   ```

2. Add a committed synchronization configuration containing `one-way-safe`, VCS exclusion, the project ignore policy, portable links, and explicit remote file/directory permissions.
3. Extend `gpu up` when `GPU_SYNC=mutagen` is selected:
   - Require `mutagen` before Terraform creates or starts resources.
   - Provision the provider and wait for SSH as it does today.
   - Create the remote workspace directory before creating the session.
   - Reconcile any recorded stale session from a previous resource without touching unrelated Mutagen sessions.
   - Create one session from the repository root to `<ssh-alias>:<remote-path>`.
   - Flush it and fail unless the session is connected, idle, and conflict-free.
   - Print the session name and the local-first next command instead of instructing the user to open remote Zed.
4. Add `gpu run -- <command> [args...]`:
   - Require a healthy session when Mutagen mode is active.
   - Flush before execution.
   - Run from the remote workspace root while preserving every argument boundary.
   - Stream stdout and stderr to Ghostty or the local Zed task terminal and return the remote exit status.
5. Extend `gpu status` to report the managed synchronization session, endpoint connectivity, pending changes, and conflicts alongside provider state.
6. Protect the two editing models:
   - `gpu zed` should refuse to open the synchronized remote tree while the Mutagen session is active and explain how to switch modes safely.
   - Remote-first operation should retain the current `./gpu up && ./gpu zed` behavior when synchronization is not enabled.
7. Extend both `gpu down` and `gpu cleanup`:
   - Resolve the exact recorded session before changing provider state.
   - Terminate that session and remove its local runtime record.
   - Stop or destroy provider resources according to the selected profile.
   - Attempt provider teardown even if Mutagen cleanup reports an error.
   - Return a non-zero status if either lifecycle operation failed and identify which operation needs attention.

### Phase 3: Add automated lifecycle tests

Use fake `mutagen`, `ssh`, and Terraform/provider commands so the normal local test suite does not provision paid infrastructure.

1. Verify that Mutagen is checked before Terraform when synchronization is requested.
2. Verify that `up` creates the expected unique `one-way-safe` session only after SSH and the remote directory are ready.
3. Verify idempotency: a repeated `up` for the same resource reuses one healthy session rather than creating duplicates.
4. Verify stale-session handling: a recorded session for an old resource is terminated before a new one is created.
5. Verify that ignored Terraform state, credentials, VCS metadata, and generated artifacts are not part of the session policy.
6. Verify that `gpu run` flushes before SSH execution, preserves arguments containing spaces and shell characters, streams both output channels, and returns the remote exit code.
7. Verify teardown ordering with an event log: exact Mutagen session termination occurs before Terraform destroy or the provider stop call.
8. Force Mutagen termination to fail and verify that provider teardown is still attempted and the combined failure is reported.
9. Verify `cleanup` uses the same synchronization teardown path as `down`.
10. Run ShellCheck, all shell tests, Terraform formatting, and Terraform validation through `make check`.

### Phase 4: Run the live RunPod acceptance test

Use the ephemeral profile so the final teardown deletes all managed storage.

1. Confirm the local repository is clean or commit intentional changes, then start the synchronized workspace:

   ```sh
   cd /Users/treyshanks/workspace/ai-performance/gpu-dev-workspace
   GPU_SYNC=mutagen ./gpu up book-ephemeral
   ./gpu status
   ```

2. Validate the initial copy:
   - Confirm the recorded Mutagen session is connected, idle, and conflict-free.
   - Compare SHA-256 hashes for `examples/mutagen_smoke.py` and `cuda/hello.cu` locally and remotely.
   - Confirm `.git`, Terraform state, account `terraform.tfvars`, and local secrets are absent from the synchronized remote tree.
3. Run the tracked Python program through the public CLI and capture its output:

   ```sh
   GPU_SYNC=mutagen ./gpu run -- python3 examples/mutagen_smoke.py
   ```

   Require the original version marker, GPU identity, successful result check, and zero exit status.
4. Edit and save the version marker locally in Zed. Do not invoke a separate manual synchronization command. Rerun the same `gpu run` command and require the new marker, proving that its pre-run flush observed the edit.
5. Make a second meaningful local edit, such as changing matrix dimensions or iteration count. Rerun and verify that the changed value and a new timing appear in stdout.
6. Build and run the existing native CUDA example through `gpu run`, proving that multiple tracked project files are synchronized:

   ```sh
   GPU_SYNC=mutagen ./gpu run -- sh -lc \
     'mkdir -p build && nvcc -O2 -lineinfo cuda/hello.cu -o build/hello && build/hello'
   ```

7. Run profiler validation only after the custom image task has supplied the tools:
   - Run `nsys profile` around the Python program and assert that a new, non-empty `.nsys-rep` exists.
   - Run a focused `ncu` pass against the native CUDA example and assert that a new, non-empty `.ncu-rep` exists.
   - Run the PyTorch profiler with CPU and CUDA activities and assert that a Chrome trace JSON file contains kernel events.
   - Explicitly collect the reports into the local `.gpu/artifacts/...` directory and verify their hashes and sizes.
8. Create a remote-only scratch or profiler file and confirm `one-way-safe` leaves it on beta without copying it into the local source tree.
9. Confirm there are no conflicts, then restore the intentional local test edits.
10. Tear down and validate both control planes:

   ```sh
   GPU_SYNC=mutagen ./gpu down
   ```

   Require all of the following:
   - The exact Mutagen session no longer appears in `mutagen sync list`.
   - Its `.gpu/` runtime record is gone.
   - Terraform has no managed Pod resource or Pod output for the ephemeral workspace.
   - The RunPod API shows that the Pod was deleted, not merely stopped.
   - SSH through the old alias can no longer reach the deleted endpoint.
   - The local repository and collected profiler artifacts remain intact.

### Acceptance criteria

- `GPU_SYNC=mutagen ./gpu up` creates exactly one healthy, uniquely named synchronization session after the GPU host is SSH-ready.
- Saving a local edit and invoking `gpu run` executes the changed code without a separate sync command.
- The MacBook remains the only Git working copy and no secrets or Terraform runtime files reach the Pod.
- Python, native CUDA, Nsight Systems, Nsight Compute, and PyTorch profiler validation produce fresh expected output or reports.
- Selected reports can be retrieved locally without enabling bidirectional source synchronization.
- Remote-only generated files do not appear in the local source tree.
- `gpu down` terminates the exact session and destroys every ephemeral RunPod resource, even when one side of teardown reports an error.
- Repeating the full up/edit/run/profile/down test leaves no Mutagen sessions, paid compute, persistent volumes, or stale local runtime records.

### Decision gate

After two clean end-to-end runs, decide whether Mutagen should become the local-first default. If it does, keep a clearly documented remote-first opt-out and preserve the guard against opening the same workspace with remote Zed while synchronization is active. If session lifecycle or conflict handling is unreliable, retain sync-on-run with `rsync` as the simpler fallback.
