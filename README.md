# GPU Dev Workspace

A local-first, declarative RunPod workspace for AI performance engineering.
Edit code in this checkout, synchronize it to a public-SSH GPU Pod, then run or
profile it remotely. The repository has two intentionally separate environments:

- `configs/fundamentals.json`: a low-cost Community Pod using RunPod's maintained
  PyTorch template for early PyTorch/CUDA work.
- `configs/lecture-ngc.example.json`: a Community Pod using a private, pinned
  NVIDIA NGC PyTorch template for CUDA development and Nsight profiling.
- `configs/lecture-full.example.json`: an optional Secure Cloud Network Volume
  workspace for a project-owned, digest-pinned CUDA development and profiling image.

The complete image is defined in `images/lecture-full/`. Build it locally with
`scripts/build-image lecture-full REGISTRY/IMAGE:VERSION`; add `--push` only
when you intend to publish. Copy the returned digest into a local configuration
before creating a Pod.

The **Lecture-full GPU image** GitHub Actions workflow is the preferred
publisher: it builds Linux AMD64 and publishes a versioned tag plus a
commit-specific tag to GHCR. Record the published digest, never a mutable tag,
in the local workspace configuration.

## Recommended profiling template: NVIDIA NGC

Use NVIDIA's pinned `nvcr.io/nvidia/pytorch:24.07-py3` image for the advanced
lecture profile instead of maintaining a project image. NVIDIA documents this
release as including CUDA 12.5.1, Nsight Compute, and Nsight Systems. Create
an NGC API key, save it in the macOS Keychain service `ngc-api-key`, and create
a private RunPod registry credential with username `$oauthtoken`. Keep that
credential ID and the private RunPod template ID out of version control.

Copy the example to an ignored local configuration, replace the template ID,
and inspect the request before creating a disposable validation Pod:

```sh
cp configs/lecture-ngc.example.json configs/lecture-ngc.local.json
# Edit template_id in configs/lecture-ngc.local.json.
./workspacectl plan configs/lecture-ngc.local.json
./workspacectl create configs/lecture-ngc.local.json --apply
```

The image reference must be pinned by digest when the private template is
created. This avoids mutable-tag surprises while retaining NVIDIA's maintained
CUDA, PyTorch, compiler, and profiler stack.

## Configure a workspace

Configurations are JSON and are the source of truth for GPU count/type, data
center preference, image/template, storage, and lifecycle mode. Inspect the
exact REST request before it can create a Pod:

```sh
./workspacectl plan configs/fundamentals.json \
  --set gpu_count=2 \
  --set storage.volume_gb=50 \
  --set gpu_type_ids='["NVIDIA GeForce RTX 4090"]'
```

`fundamentals` is disposable Community storage. `lecture-full` requires a
published project image digest, a Secure Cloud Network Volume ID, and a data
center matching that volume; copy its example configuration to an ignored local
file and replace its explicit placeholders.

Create the Network Volume first, using the same data center that the
`lecture-full` Pod will request:

```sh
./workspacectl volume-plan configs/lecture-volume.example.json
./workspacectl volume-create path/to/lecture-volume.local.json --apply
```

The create operation is dry-run by default. A resource is created only with:

```sh
./workspacectl create path/to/workspace.json --apply
```

The client reads `RUNPOD_API_KEY` only for live operations, falling back to the
`runpod-gpu-workspace` macOS Keychain item. Use a restricted key with Pods
read/write access. Never store a key or a registry token in this repository.

## Edit locally, run remotely

Every workspace requests a public IP and mapped TCP/22. After creation, sync
the current checkout to the workspace (inspect first, then add `--apply`):

```sh
./workspacectl sync POD_ID --identity-file ~/.ssh/gpu_dev_ed25519
./workspacectl sync POD_ID --identity-file ~/.ssh/gpu_dev_ed25519 --apply
```

The sync command uses `rsync` over direct SSH and excludes `.git` and Python
bytecode. It deliberately refuses RunPod's basic SSH proxy because that proxy
does not support the file-transfer and editor workflow. Point Zed, VS Code, or
another remote-SSH editor at the printed host and port using the same identity
file.

## Lifecycle and cost

`status` is read-only. `stop` prints its request until `--apply` is supplied.
`destroy` requires `--confirm POD_ID`. Community disposable storage is removed
on destroy. A Secure Network Volume persists independently and continues to
incur storage cost after compute stops; delete it explicitly only when its data
is no longer needed.

```sh
./workspacectl status POD_ID
./workspacectl logs POD_ID
./workspacectl start POD_ID --apply
./workspacectl stop POD_ID
./workspacectl stop POD_ID --apply
./workspacectl destroy POD_ID --confirm POD_ID
```

Run `make check` for all local validation. Live Pod validation and any RunPod
lifecycle action require explicit user approval.
