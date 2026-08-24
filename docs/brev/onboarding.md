# Brev + NGC onboarding

This is the supported GPU workspace route: a Brev **VM** provides managed SSH and persistent `/home/ubuntu/workspace`; an official NVIDIA NGC container provides the workload. No project CUDA image or image-level SSH service is used.

## Local setup and preview

```sh
brew install brevdev/homebrew-brev/brev
brev --version
brev login
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price
brev create gpu-fundamentals --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price --dry-run
```

Require Brev CLI v0.6.334 or newer and authenticate with `brev login`. Review dry-run results manually; do not select a fundamentals result above $1.50/hour. The hardware targets, price ceilings, and deadline rules live in [`infra/brev/AGENTS.md`](../../infra/brev/AGENTS.md), not in a custom provisioner.

## Approved live session

Only after explicit approval to spend:

```sh
brev create gpu-fundamentals --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --sort price --stoppable --timeout 420
brev refresh
infra/brev/scripts/sync-source gpu-fundamentals
infra/brev/scripts/watchdog gpu-fundamentals 120 --confirm-watchdog
infra/brev/scripts/smoke gpu-fundamentals
```

`brev refresh` is the connection source of truth: it refreshes `~/.brev/ssh_config`, so `ssh INSTANCE`, `brev shell INSTANCE`, and rsync use Brev-managed connection details without image-level `sshd`. Use `brev open INSTANCE code` for an editor and `brev port-forward INSTANCE --port 6006:6006` for a private tunnel. `brev copy` is a one-off fallback; the source-sync script is the normal incremental `rsync --delete` route.

## Run the workload in NGC

After the VM is ready, enter its managed shell and run exercises through the
compose service. Do not run CUDA, Triton, or profiling commands directly on
the VM host.

```sh
brev shell gpu-profiling
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
```

Generated plots, traces, and reports belong beneath the lecture's
`artifacts/` directory. To run the validated Triton/Nsight Compute workflow
and bring its results back to the Mac, follow [`ncu.md`](ncu.md).

## NGC and cleanup

Save a user-owned NGC API key without exposing it on the command line:

```sh
security add-generic-password -U -a "$USER" -s ngc-api-key -w
```

On the Mac, `infra/brev/scripts/ngc-login INSTANCE` streams the Keychain secret over managed SSH directly into remote `docker login nvcr.io` with username `$oauthtoken`. Do not enable shell tracing or record its output. `infra/brev/compose/ngc-pytorch.compose.yaml` uses the versioned upstream `nvcr.io/nvidia/pytorch:24.07-py3` release and all GPUs. Before upgrades, review NVIDIA release notes, record the tag or authenticated digest and tool versions in the commit, then run an approved smoke session.

Stopping preserves `/home/ubuntu/workspace`, but provider capacity can be unavailable after a stop and storage may continue to cost money. Deletion permanently removes instance data. Schedule the local watchdog immediately; the maximum validation budget is a profile’s boot ceiling plus runtime deadline. Review Brev Console billing, credit, and resource-limit alerts before and after every session. Record provider, GPU, price, boot time, cleanup result, and billing evidence location in ignored `reports/brev/`, never tracked files.
