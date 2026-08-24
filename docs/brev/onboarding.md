# Brev + NGC onboarding

This is the supported GPU workspace route: a Brev **VM** provides managed SSH and persistent `/home/ubuntu/workspace`; an official NVIDIA NGC container provides the workload. No project CUDA image or image-level SSH service is used.

## Local setup

```sh
brew install brevdev/homebrew-brev/brev
brev --version
brev login
```

Require Brev CLI v0.6.334 or newer and authenticate with `brev login`. Then follow [choosing a GPU development VM](instance-selection.md): it first reuses a suitable stopped VM, then covers the hardware requirements and the five-candidate price-and-boot-time search for a new one.

## AI-agent CLI support

The Brev CLI's `brev-cli` skill is installed for Codex through the Brev plugin. For every Brev or NGC task, use that skill: it translates natural-language requests into the supported CLI workflow, checks the current instance inventory, shows cost before creation, and requires confirmation for stop or delete operations. Keep the skill current with `brev agent-skill install`; start a new Codex task after updating it. See NVIDIA's [Using the CLI with AI Agents](https://docs.nvidia.com/brev/guides/ai-agents/cli-with-agents) guide for installation, updates, and safety behavior.

## Approved live session

Only after explicit approval to spend:

```sh
brev create INSTANCE --min-vram 16 --min-capability 8.0 --min-disk 100 --sort price --stoppable --timeout 420
brev refresh
infra/brev/scripts/sync-source INSTANCE
infra/brev/scripts/watchdog INSTANCE 120 --confirm-watchdog
infra/brev/scripts/smoke INSTANCE
```

`brev refresh` is the connection source of truth: it refreshes `~/.brev/ssh_config`, so `ssh INSTANCE`, `brev shell INSTANCE`, and rsync use Brev-managed connection details without image-level `sshd`. Use `brev open INSTANCE code` for an editor and `brev port-forward INSTANCE --port 6006:6006` for a private tunnel. `brev copy` is a one-off fallback; the source-sync script is the normal incremental `rsync --delete` route.

## Run the workload in NGC

After the VM is ready, enter its managed shell and run exercises through the
compose service. Do not run CUDA, Triton, or profiling commands directly on
the VM host.

```sh
brev shell INSTANCE
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
```

Generated plots, traces, and reports belong beneath the lecture's
`artifacts/` directory. To run the validated Triton/Nsight Compute workflow
and bring its results back to the Mac, follow [`ncu.md`](ncu.md).

For live workspace inventory and replacing an unavailable VM with a comparably
sized and priced candidate, follow [choosing a GPU development VM](instance-selection.md).

## NGC and cleanup

Save a user-owned NGC API key without exposing it on the command line:

```sh
security add-generic-password -U -a "$USER" -s ngc-api-key -w
```

On the Mac, `infra/brev/scripts/ngc-login INSTANCE` streams the Keychain secret over managed SSH directly into remote `docker login nvcr.io` with username `$oauthtoken`. Do not enable shell tracing or record its output. `infra/brev/compose/ngc-pytorch.compose.yaml` uses the versioned upstream `nvcr.io/nvidia/pytorch:24.07-py3` release and all GPUs. Before upgrades, review NVIDIA release notes, record the tag or authenticated digest and tool versions in the commit, then run an approved smoke session.

Stopping preserves `/home/ubuntu/workspace`, but provider capacity can be unavailable after a stop and storage may continue to cost money. Deletion permanently removes instance data. Schedule the local watchdog immediately; the maximum validation budget is a profile’s boot ceiling plus runtime deadline. Review Brev Console billing, credit, and resource-limit alerts before and after every session. Record provider, GPU, price, boot time, cleanup result, and billing evidence location in ignored `reports/brev/`, never tracked files.

## Conditional instance-cost email alerts

To catch an instance left running, a local Codex automation named **Brev instance cost and status review** runs every four hours. It audits the Brev inventory and estimated cost, then sends a Resend email only when it finds a RUNNING cloud workspace or the audit encounters a Brev, pricing, or authentication error. A clean stopped-only report stays in Codex and does not send email.

The Resend key is stored only in the macOS Keychain under the `codex-brev-resend-api-key` service and is read at send time; do not put it in this repository, a shell profile, or the automation prompt. The alert is a reminder to stop the workspace when finished; it never starts, stops, resets, or deletes Brev instances.
