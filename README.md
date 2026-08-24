# GPU Dev Workspace

Learn GPU programming on real hardware without owning a GPU. Edit locally,
sync to a short-lived Brev VM, run inside the pinned NVIDIA NGC container, and
keep the useful artifacts.

## Start here

1. Read the [Brev + NGC onboarding guide](docs/brev/onboarding.md).
2. Choose or restart a VM with the [GPU VM selection guide](docs/brev/instance-selection.md).
3. Start with [GPU MODE Lecture 001](curriculum/gpu-mode-lecture-001/).

The lessons run in the NGC container, not directly on the VM host. For editor
setup, see [editor support](docs/brev/editor.md).

## A few useful places

- [Curriculum](curriculum/README.md) — exercises and artifacts.
- [Brev infrastructure rules](infra/brev/AGENTS.md) — VM lifecycle, sync, and NGC.
- [Nsight Compute guide](docs/brev/ncu.md) — profiling workflow.
- [Scripts](scripts/README.md) — local helpers.
- [Today I Learned](TIL.md) — notes from the journey.

## Budget-friendly GPU programming

Prefer a suitable stopped VM before creating another one—it starts faster and
keeps its workspace. Creating or starting a VM costs money, so check the
candidate list, use dry-runs, and stop the VM when you are done.
