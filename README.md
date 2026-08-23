# GPU Dev Workspace

A small Terraform control plane for opening the same Zed workspace on RunPod or GCP:

```sh
GPU_PROVIDER=runpod ./gpu up
GPU_PROVIDER=runpod ./gpu zed
GPU_PROVIDER=runpod ./gpu down
```

RunPod defaults to a non-interruptible Community RTX 3090 with the project-owned CUDA 13.0/PyTorch 2.9.1 development image. This is the cheapest current target that supports the architecture-neutral single-GPU exercises. GCP defaults to a Spot `n1-standard-4` plus one T4 with a managed CUDA 12.9/PyTorch 2.9 image because G2/L4 machines cannot boot Deep Learning VM images.

See [GPU_TYPES.md](GPU_TYPES.md) for the current target GPUs, live price snapshots, selection guidance, and source links.

See [IMAGE.md](IMAGE.md) for the image build, publication, validation, and startup-measurement workflow. See [DEVELOPMENT_WORKFLOWS.md](DEVELOPMENT_WORKFLOWS.md) for remote-first and local-first iterative development loops. Remaining work is tracked in [task.md](task.md).

## Local prerequisites

- Terraform 1.8+
- Zed with its CLI installed (`Cmd+Shift+P`, then `cli: install`)
- OpenSSH, `curl`, and `jq`
- ShellCheck (`brew install shellcheck`)
- A RunPod Ed25519 SSH key at `~/.ssh/gpu_dev_ed25519`; GCP defaults to `~/.ssh/id_ed25519`. Either can be overridden with `RUNPOD_SSH_KEY` / `GCP_SSH_KEY`.

Run the local proof before spending money:

```sh
make check
```

To lint only the CLI script:

```sh
make lint
```

## RunPod setup (primary)

1. Create a RunPod account and add a payment method.
2. Create a restricted API key with **Pods: Read/Write**, then store it in the macOS login Keychain:

   ```sh
   security add-generic-password \
     -U \
     -a "$USER" \
     -s "runpod-gpu-workspace" \
     -w
   ```

   RunPod commands retrieve it automatically without exposing it in shell history or exporting it in your parent terminal. An explicitly set `RUNPOD_API_KEY` takes precedence.

3. Add the contents of `~/.ssh/gpu_dev_ed25519.pub` in **Settings > SSH Public Keys**.
4. Copy and edit the provider inputs:

   ```sh
   cp infra/runpod/terraform.tfvars.example infra/runpod/terraform.tfvars
   ```

5. Start the ephemeral lab, open it in Zed, and delete it when finished:

   ```sh
   ./gpu up
   ./gpu zed
   ./gpu down
   ```

By default, `up` creates no persistent Pod volume. `/workspace` lives on the container disk, and `down` destroys the Pod and its data so no managed stopped-volume charge remains.

Select the declarative `book-persistent` profile when you deliberately want the workspace to survive `down`:

```sh
./gpu up book-persistent
./gpu down
./gpu cleanup
```

The profile at `profiles/book-persistent/runpod.tfvars` adds a 50 GB `/workspace` Pod volume. Terraform derives that `down` should stop rather than destroy from its persistence setting. Every `up` for that workspace must select the same profile; this guard prevents an accidental profile change from deleting data. `cleanup` requires confirmation and deletes the managed Pod and volume. At current rates, retaining it while stopped costs about $10/month.

RunPod Community hosts must support a public IP for Zed's full SSH connection. If a selected host has no public IP, choose another GPU or Secure Cloud machine.

The configuration pins RunPod's Terraform provider to 1.0.8. Version 1.0.9 currently publishes an invalid schema and fails before Terraform can validate any configuration; retest before upgrading.

## GCP setup (fallback)

1. Create a billed GCP project, enable the Compute Engine API, and request one T4 GPU quota in `us-west1` if the project has none.
2. Install and authenticate the Google Cloud CLI for Application Default Credentials:

   ```sh
   gcloud auth application-default login
   ```

3. Find your current public IPv4 address and copy the example inputs:

   ```sh
   curl -4 https://ifconfig.me
   cp infra/gcp/terraform.tfvars.example infra/gcp/terraform.tfvars
   ```

4. Put the project ID, public key line, and your IP with `/32` in `terraform.tfvars`, then run:

   ```sh
   GPU_PROVIDER=gcp ./gpu up
   GPU_PROVIDER=gcp ./gpu zed
   GPU_PROVIDER=gcp ./gpu down
   ```

The firewall accepts SSH only from the configured `/32`. Update it when your public IP changes. GCP requires a boot disk; the default `book-ephemeral` profile marks it auto-delete, and `down` destroys the VM and disk. `GPU_PROVIDER=gcp ./gpu up book-persistent` instead declares that `down` should stop the VM and preserve its boot disk. Its storage charge is about $4/month at current U.S. standard-disk rates.

## Workload profiles

Profiles are ordinary Terraform variable files under `profiles/<profile>/<provider>.tfvars`. The CLI only selects a profile and passes its provider file to Terraform. Each file declares the workload's GPU, image, disk sizing, Spot policy, and persistence. Terraform derives lifecycle outputs from those inputs:

```sh
./gpu up                         # book-ephemeral on RunPod
./gpu up book-persistent
GPU_PROVIDER=gcp ./gpu up        # book-ephemeral on GCP
GPU_PROVIDER=gcp ./gpu up book-persistent
```

The same profile name exists for each provider, while its concrete machine configuration remains provider-specific. Account-specific values such as the GCP project, SSH key, and source CIDR remain in the ignored `terraform.tfvars` file.

## Persistence policy

- Git is the source-of-truth backup for code. Provider disks are working storage, not backups.
- Ephemeral mode is the default: `down` deletes compute and its managed disk data.
- Persistent mode is opt-in with `up book-persistent`: `down` stops compute and retains storage charges.
- `cleanup` deletes the workspace and persistent storage after provider-name confirmation. RunPod Pod volumes and GCP boot disks are attached to their workspace, so cleanup deletes the managed compute resource too.
- Snapshots are deliberately not enabled by default because they add storage cost; a later profile can add incremental snapshots for valuable benchmark checkpoints.
- Keep profiler reports and compact processed datasets. Re-download large public training corpora instead of paying to retain duplicates on every provider.

## Working remotely

`gpu up` waits for full SSH, creates the `gpu-runpod` or `gpu-gcp` SSH alias, and runs the image's complete CUDA, Nsight, NumPy, PyTorch, and Triton smoke test before seeding this committed repo into `/workspace/gpu-dev-workspace`. The seed creates a remote Git repository without copying local credentials or Terraform state. Push valuable work to Git before `down` in ephemeral mode.

The CLI keeps generated aliases in `~/.ssh/config.d/gpu-workspace-*`. On first use it prepends one `Include` line to `~/.ssh/config` and saves the original as `~/.ssh/config.gpu-workspace.bak`. Existing aliases remain untouched. RunPod connection addresses can change after a stop, so `gpu up`, `gpu ssh`, and `gpu zed` refresh the alias before connecting.

In Zed, run `task: spawn` and select **CUDA: build and run smoke test**. Expected output:

```text
CUDA answer: 42
```

Useful commands:

```sh
./gpu status
./gpu ssh
./gpu ssh nvidia-smi
```

## Cost safety

Terraform derives `down_action` from the profile's persistence setting: `book-ephemeral` destroys the workspace, while `book-persistent` stops compute and leaves storage billable until `cleanup`. There is not yet a provider-independent idle reaper; set billing alerts in both providers and always run `gpu down` at the end of a session.

## Deliberately deferred

- Vast.ai: add it after RunPod and GCP complete the CUDA smoke test.
- Additional workload profiles: add them only when an exercise needs different hardware or software.
- Shared Terraform modules: provider lifecycle and storage semantics are different enough that duplication is safer and smaller.
