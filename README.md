# GPU Dev Workspace

A small Terraform control plane for opening the same Zed workspace on RunPod or GCP:

```sh
GPU_PROVIDER=runpod ./gpu up
GPU_PROVIDER=runpod ./gpu zed
GPU_PROVIDER=runpod ./gpu down
```

RunPod is the default. GCP uses an `n1-standard-4` plus one T4 because G2/L4 machines cannot boot Deep Learning VM images; the T4 path gives us a prebuilt CUDA 12.8 host without maintaining an image yet.

## Local prerequisites

- Terraform 1.8+
- Zed with its CLI installed (`Cmd+Shift+P`, then `cli: install`)
- OpenSSH, `curl`, and `jq`
- An Ed25519 SSH key at `~/.ssh/id_ed25519`, or set `RUNPOD_SSH_KEY` / `GCP_SSH_KEY`

Run the local proof before spending money:

```sh
make check
```

## RunPod setup (primary)

1. Create a RunPod account and add a payment method.
2. Create an API key in **Settings > API Keys** and export it:

   ```sh
   export RUNPOD_API_KEY='...'
   ```

3. Add the contents of `~/.ssh/id_ed25519.pub` in **Settings > SSH Public Keys**.
4. Copy and edit the provider inputs:

   ```sh
   cp infra/runpod/terraform.tfvars.example infra/runpod/terraform.tfvars
   ```

5. Start the lab, open it in Zed, and stop it when finished:

   ```sh
   ./gpu up
   ./gpu zed
   ./gpu down
   ```

The first `up` creates the Pod. Later calls resume it. `down` stops compute but keeps the `/workspace` Pod volume, which continues to incur storage charges. `destroy` permanently deletes resources and requires typing the provider name.

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

The firewall accepts SSH only from the configured `/32`. Update it when your public IP changes. GCP `down` stops compute while retaining the boot disk; disk charges continue.

## Working remotely

`gpu up` waits for full SSH, verifies `nvidia-smi`, and seeds this committed repo into `/workspace/gpu-dev-workspace` once. It creates a remote Git repository without copying local credentials or Terraform state. Add your Git remote there if you want to push; otherwise stop rather than destroy the provider so the workspace persists.

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

`down` is intentionally a stop, not a destroy, so the workspace survives. There is not yet a provider-independent idle reaper: RunPod's current Terraform provider marks its old auto-stop fields deprecated, and a local laptop timer is not a reliable cloud failsafe. Until a cloud-side reaper is added, set billing alerts in both providers and always run `gpu down` at the end of a session.

## Deliberately deferred

- Vast.ai: add it after RunPod and GCP complete the CUDA smoke test.
- Custom Docker image: add it when package drift or startup time is measured as a problem.
- GPU profile abstraction: plain provider variables already select hardware.
- Shared Terraform modules: provider lifecycle and storage semantics are different enough that duplication is safer and smaller.
