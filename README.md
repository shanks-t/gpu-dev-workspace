# GPU Fundamentals

Learn GPU programming fundamentals on real hardware without owning a GPU.
Work through *[Programming Massively Parallel
Processors](https://shop.elsevier.com/books/programming-massively-parallel-processors/hwu/978-0-443-43900-1)*,
by Hwu, Kirk, and Hajj; edit and commit in a short-lived Brev VM, run inside
the pinned NVIDIA NGC container, and pull the work back to your Mac.

## Start here

1. Read the [Brev + NGC onboarding guide](docs/brev/onboarding.md).
2. Choose or restart a VM with the [GPU VM selection guide](docs/brev/instance-selection.md).
3. Choose the current chapter in *Programming Massively Parallel Processors*.
4. Start with the related curriculum material: [GPU MODE Lecture 001](curriculum/gpu-mode-lecture-001/) or [GPU MODE Lecture 002](curriculum/gpu-mode-lecture-002/).

The lessons run in the NGC container, not directly on the VM host. For editor
setup, see [editor support](docs/brev/editor.md).

## Run the GPU workspace

Use the container-backed workspace for CUDA Python, notebooks, and profiling.
The complete setup—starting the Brev VM, checking out the repository, launching
JupyterLab, opening VS Code in the Dev Container, and stopping the VM—is in
the [Brev + NGC workspace guide](docs/brev/onboarding.md). For the editor
workflow and extension-cache behavior, see [editor support](docs/brev/editor.md).

## A few useful places

- [Curriculum](curriculum/README.md) — exercises and artifacts.
- [Learning tools](learning-tools/README.md) — reusable interactive visualizations.
- [Programming Massively Parallel Processors](https://shop.elsevier.com/books/programming-massively-parallel-processors/hwu/978-0-443-43900-1) — primary textbook; add chapter-aligned source links to learner notes and exercises.
- [Brev infrastructure rules](infra/brev/AGENTS.md) — VM lifecycle and NGC.
- [Remote Git workspace](docs/brev/git-workspace.md) — migration and commit/push workflow.
- [Nsight Compute guide](docs/brev/ncu.md) — profiling workflow.
- [Scripts](scripts/README.md) — local helpers.
- [Today I Learned](TIL.md) — notes from the journey.

## Budget-friendly GPU programming

Prefer a suitable stopped VM before creating another one—it starts faster and
keeps its workspace. Creating or starting a VM costs money, so check the
candidate list, use dry-runs, and stop the VM when you are done.
