# GPU Dev Workspace

The default GPU development route is NVIDIA Brev VMs plus official NVIDIA NGC workloads. Edit locally, synchronize to `/home/ubuntu/workspace` with Brev-managed SSH, and run CUDA/PyTorch inside the pinned NGC container. No alternate provider backend is supported.

## Start here

```sh
make check
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price
```

Read [Brev onboarding](docs/brev/onboarding.md) before any live action. It explains installation, interactive authentication, profile price caps, NGC Keychain handling, source synchronization, mandatory watchdogs, billing evidence, and cleanup. Live provisioning is intentionally not performed by this repository without fresh user approval.

For PyTorch hover documentation, open the workspace on the Brev VM in the
pinned NGC development container. See [editor support](docs/brev/editor.md).

## Layout

- `curriculum/brev/`: learner code and attributed reference notes.
- `infra/brev/AGENTS.md`: GPU search targets and cost controls.
- `infra/brev/scripts/`: guarded lifecycle, sync, login, watchdog, and smoke commands.
- `infra/brev/compose/`: NGC workload contract.
- `docs/brev/`: onboarding and decisions.
- `reports/brev/`: ignored local cost and run evidence.

Use the direct `brev` commands in [`infra/brev/AGENTS.md`](infra/brev/AGENTS.md) for fundamentals and profiling. They document qualifying hardware, manual price caps, dry-run-first creates, and runtime limits without a custom control plane.

## Validate an approved VM

After approval and creation, refresh, synchronize, and run the deterministic smoke check:

```sh
brev refresh
infra/brev/scripts/sync-source INSTANCE
infra/brev/scripts/watchdog INSTANCE 120 --confirm-watchdog
infra/brev/scripts/smoke INSTANCE
```

The smoke checks host CUDA, Docker GPU visibility, NGC PyTorch CUDA, `nvcc`, `ncu`, `nsys`, PyTorch CUDA, source sync, and the Lecture 001 PyTorch square exercise. Stop with `brev stop INSTANCE`; delete with `brev delete INSTANCE` after saving ignored billing evidence.
