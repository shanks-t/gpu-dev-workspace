# GPU Dev Workspace

An inexpensive, disposable GPU development environment for learning CUDA and
performance engineering. It provisions a GPU on RunPod or Google Cloud, opens
the workspace over SSH in Zed, and gives developers a short path from their Mac
to hands-on [GPU MODE](https://github.com/gpu-mode/lectures) exercises.

The default learning target is a single, low-cost GPU. It is enough for CUDA C++,
PyTorch, Triton, profiling, and most single-GPU experiments. It is not intended
to reproduce multi-GPU or Blackwell-only results.

## Start here

1. Install the local tools: Terraform 1.8+, OpenSSH, `curl`, `jq`, and
   ShellCheck. Install Zed and its CLI (`Cmd+Shift+P` → **cli: install**) to
   open the remote workspace.
2. From this repository, prove the local tooling before provisioning anything:

   ```sh
   make check
   ```

3. Set up **one** provider below. RunPod is the recommended first path; GCP is
   the fallback when its quota and capacity are available.
4. Start a workspace, open it, and stop it when finished:

   ```sh
   ./gpu up basics-cuda
   ./gpu zed
   ./gpu down
   ```

`down` is important: the default learning profiles are ephemeral and remove
their managed compute and storage. Use `./gpu status` at any time to see what
is running.

## RunPod — recommended

RunPod Community is usually the simplest and least expensive way to begin. The
`basics-cuda` profile uses one RTX 3090 when capacity is available.

### One-time account and SSH setup

1. Create a RunPod account and payment method.
2. Create a **Restricted** API key with **Pods: Read/Write** only. Do not use
   an all-access key.
3. Store the key in the macOS login Keychain. The `security` command prompts
   for the secret, so it is not placed in shell history:

   ```sh
   security add-generic-password -U -a "$USER" \
     -s "runpod-gpu-workspace" -w
   ```

   The `gpu` CLI reads this Keychain item automatically. Set `RUNPOD_API_KEY`
   only for temporary or CI use.
4. Create a dedicated SSH key if you do not already have one, then add its
   public half in the RunPod **SSH Public Keys** settings:

   ```sh
   test -f "$HOME/.ssh/gpu_dev_ed25519" || \
     ssh-keygen -t ed25519 -f "$HOME/.ssh/gpu_dev_ed25519" \
       -C "$USER@gpu-dev-workspace"
   cat "$HOME/.ssh/gpu_dev_ed25519.pub"
   ```

### Daily loop

```sh
./gpu up basics-cuda       # provision, wait for SSH, and run a GPU smoke test
./gpu zed                  # open /workspace/gpu-dev-workspace in Zed
./gpu ssh nvidia-smi       # optional: inspect the assigned GPU
./gpu status               # optional: inspect lifecycle and cost state
./gpu down                 # delete the ephemeral workspace
```

The CLI creates and refreshes the `gpu-runpod` SSH alias, including after a
stopped Pod receives a new address. It seeds the committed repository into the
remote workspace; push or otherwise copy valuable remote-first work before
tearing down an ephemeral Pod.

## Google Cloud — fallback

Google Cloud uses a Spot T4 profile as the lower-cost fallback. Before the
first run, create a billed project, enable Compute Engine, and request the
required GPU quota in the chosen region. GPU quota and capacity are separate:
quota alone does not guarantee that a zone has a GPU available.

1. Install the Google Cloud CLI and authenticate Terraform with Application
   Default Credentials:

   ```sh
   gcloud auth application-default login
   ```

2. Create or choose the SSH key the VM will accept, then copy its **public**
   key line and current public IPv4 address:

   ```sh
   test -f "$HOME/.ssh/id_ed25519" || \
     ssh-keygen -t ed25519 -f "$HOME/.ssh/id_ed25519" \
       -C "$USER@gpu-dev-workspace"
   cat "$HOME/.ssh/id_ed25519.pub"
   curl -4 https://ifconfig.me
   ```

3. Create your ignored local configuration and fill in the project ID, public
   key, and IP address with `/32`:

   ```sh
   cp infra/gcp/terraform.tfvars.example infra/gcp/terraform.tfvars
   ```

4. Provision and use the GCP profile:

   ```sh
   GPU_PROVIDER=gcp ./gpu up book-ephemeral
   GPU_PROVIDER=gcp ./gpu zed
   GPU_PROVIDER=gcp ./gpu down
   ```

The firewall permits SSH only from the configured `/32`; update
`ssh_source_cidr` if your network changes. `terraform.tfvars` is ignored and
must never be committed.

## Work through GPU MODE Lecture 001

After the basic CUDA path works, use the repository’s runnable, attributed
adaptation of GPU MODE's first lecture: PyTorch profiling, inline C++/CUDA,
Triton, and Numba.

```sh
./gpu up gpu-mode-lecture-001
./gpu zed
```

Follow the [lecture guide](curriculum/gpu-mode-lecture-001/README.md) in the
remote workspace. This advanced profile retains a 50 GB workspace so compiler
caches and profiler artifacts survive `down`; it therefore continues to incur
storage cost until you run `./gpu cleanup`. It also requires the project image
to be published and, while that image is private, its RunPod registry
authentication ID in `infra/runpod/terraform.tfvars`.

## CLI reference

| Command | What it does |
| --- | --- |
| `./gpu up [PROFILE]` | Provision or start a workspace, wait for SSH, validate the GPU environment, and seed the repository. |
| `./gpu zed` | Open the remote workspace in Zed. |
| `./gpu ssh [COMMAND]` | Open a shell or run one command through the managed SSH alias. |
| `./gpu status` | Show the provider's workspace state and retained-storage status. |
| `./gpu down` | Delete an ephemeral workspace or stop a persistent one. |
| `./gpu cleanup` | Permanently delete a persistent workspace and its storage after confirmation. |
| `make check` | Run shell, test, Terraform formatting, and Terraform validation checks locally. |

Set `GPU_PROVIDER=runpod` (the default) or `GPU_PROVIDER=gcp` before any CLI
command. Profiles describe the GPU, image, capacity policy, and lifecycle;
see `profiles/<profile>/<provider>.tfvars` for their exact choices.

## Safety and cost rules

- Treat provider workspaces as disposable compute, not backups.
- Keep code in Git; `down` removes the default workspace and its remote edits.
- Prefer the small learning profiles. Pick larger hardware only when an
  exercise explicitly requires it.
- Set provider billing alerts. There is no provider-independent idle reaper.
- Use `cleanup` after finishing any persistent profile.
- Keep API keys, private keys, and local `terraform.tfvars` files out of Git.

## More detail

- [GPU targets and current pricing](docs/GPU_TYPES.md)
- [Remote-first and local-first development workflows](docs/DEVELOPMENT_WORKFLOWS.md)
- [Image build and validation workflow](docs/IMAGE.md)
- [Image/profile recommendations](docs/IMAGE_RECOMMENDATION.md)
- [Spec workflow for scoped changes](specs/README.md)

The full upstream lecture catalogue lives in the
[GPU MODE lectures repository](https://github.com/gpu-mode/lectures).
