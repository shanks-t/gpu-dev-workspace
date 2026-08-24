# GPU Dev Workspace

The default GPU development route is NVIDIA Brev VMs plus official NVIDIA NGC workloads. Edit locally, synchronize to `/home/ubuntu/workspace` with Brev-managed SSH, and run CUDA/PyTorch inside the pinned NGC container. No alternate provider backend is supported.

## Start here

```sh
make check
make plan-fundamentals
infra/brev/scripts/brevctl search fundamentals
```

Read [Brev onboarding](docs/brev/onboarding.md) before any live action. It explains installation, interactive authentication, profile price caps, NGC Keychain handling, source synchronization, mandatory watchdogs, billing evidence, and cleanup. Live provisioning is intentionally not performed by this repository without fresh user approval.

## Layout

- `curriculum/brev/`: learner code and attributed reference notes.
- `infra/brev/profiles/`: declarative fundamentals and profiling requirements.
- `infra/brev/scripts/`: guarded lifecycle, sync, login, watchdog, and smoke commands.
- `infra/brev/compose/`: NGC workload contract.
- `docs/brev/`: onboarding and decisions.
- `reports/brev/`: ignored local cost and run evidence.

The `fundamentals` profile requests one 16–24 GB, compute-capability 8.0+ GPU, price sorted and stoppable. `profiling` requests one 48 GB, compute-capability 8.9+ GPU for Nsight work. They render documented `brev search --json` and `brev create --dry-run` commands, not an undocumented provider API.

## Validate an approved VM

After approval and creation, refresh, synchronize, and run the deterministic smoke check:

```sh
brev refresh
infra/brev/scripts/sync-source INSTANCE
infra/brev/scripts/watchdog INSTANCE 120 --confirm-watchdog
infra/brev/scripts/smoke INSTANCE
```

The smoke checks host CUDA, Docker GPU visibility, NGC PyTorch CUDA, `nvcc`, `ncu`, `nsys`, PyTorch CUDA, source sync, and the Lecture 001 PyTorch square exercise. Stop with `infra/brev/scripts/brevctl stop INSTANCE`; delete only with `infra/brev/scripts/brevctl delete INSTANCE --confirm` after saving ignored billing evidence.
