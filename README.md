# GPU Fundamentals

Learn GPU programming fundamentals on real hardware without owning a GPU.
Work through *[Programming Massively Parallel
Processors](https://shop.elsevier.com/books/programming-massively-parallel-processors/hwu/978-0-443-43900-1)*,
by Hwu, Kirk, and Hajj; edit and commit in a short-lived Brev VM, run inside
the pinned NVIDIA NGC container, and pull the work back to your Mac.

## Start here

1. Read the [GPU kernel development workspace guide](docs/brev/workspace.md).
2. Choose the current chapter in *Programming Massively Parallel Processors*.
3. Start with the related curriculum material: [GPU MODE Lecture 001](curriculum/gpu-mode-lecture-001/) or [GPU MODE Lecture 002](curriculum/gpu-mode-lecture-002/).

The lessons run in the NGC container, not directly on the VM host.

## Run the GPU workspace

Use the container-backed workspace for CUDA Python, notebooks, profiling, and
Git synchronization. The [GPU kernel development workspace guide](docs/brev/workspace.md)
is the canonical setup and daily workflow.

## A few useful places

- [Curriculum](curriculum/README.md) — exercises and artifacts.
- [Learning tools](learning-tools/README.md) — reusable interactive visualizations.
- [Programming Massively Parallel Processors](https://shop.elsevier.com/books/programming-massively-parallel-processors/hwu/978-0-443-43900-1) — primary textbook; add chapter-aligned source links to learner notes and exercises.
- [Brev infrastructure rules](infra/brev/AGENTS.md) — VM lifecycle and NGC.
- [GPU kernel development workspace](docs/brev/workspace.md) — VM, editor, GPU, and Git workflow.
- [Scripts](scripts/README.md) — local helpers.
- [Today I Learned](TIL.md) — notes from the journey.

## Budget-friendly GPU programming

Prefer a suitable stopped VM before creating another one—it starts faster and
keeps its workspace. Creating or starting a VM costs money, so check the
candidate list, use dry-runs, and stop the VM when you are done.
