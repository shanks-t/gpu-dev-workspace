# GPU Dev Workspace

A local-first, declarative RunPod workspace for AI performance engineering.
Edit code in this checkout, synchronize it to a public-SSH GPU Pod, then run or
profile it remotely. The repository has two intentionally separate environments:

- `configs/fundamentals.json`: a low-cost Community Pod using RunPod's maintained
  PyTorch template for early PyTorch/CUDA work.
- `configs/lecture-full.example.json`: a Secure Cloud Network Volume workspace
  for the project-owned, digest-pinned CUDA development and profiling image.

The complete image is defined in `images/lecture-full/`. Build it locally with
`scripts/build-image lecture-full REGISTRY/IMAGE:VERSION`; add `--push` only
when you intend to publish. Copy the returned digest into a local configuration
before creating a Pod.

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
./workspacectl stop POD_ID
./workspacectl stop POD_ID --apply
./workspacectl destroy POD_ID --confirm POD_ID
```

Run `make check` for all local validation. Live Pod validation and any RunPod
lifecycle action require explicit user approval.
