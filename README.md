# GPU Dev Workspace

> A practical, cost-conscious workspace for learning GPU programming without
> owning a GPU or keeping an expensive cluster running.

GPU programming is learned by doing: write a kernel, run it on real hardware,
measure it, and try again. This repository makes that loop approachable on
on-demand compute. It pairs local editing with a short-lived GPU VM and a
pinned NVIDIA NGC development container, so the environment is reproducible
and the meter stops when the session ends.

It is deliberately a personal learning workspace, but its workflow is meant
to be reusable by anyone who wants hands-on GPU practice on a limited budget.

```text
edit locally  →  sync to a GPU VM  →  run in NVIDIA NGC  →  profile & learn
     ↑                                                              │
     └────────────────── save artifacts, notes, and improvements ──┘
                                      ↓
                            stop the VM when finished
```

## Start here

1. Run the repository checks:

   ```sh
   make check
   ```

2. Read the [Brev + NGC onboarding guide](docs/brev/onboarding.md). It is the
   complete guide to installing and authenticating the CLI, choosing a
   cost-capped GPU, creating a VM, syncing the workspace, using NGC securely,
   and cleaning up.

3. Browse [the curriculum](curriculum/README.md), then begin with
   [`gpu-mode-lecture-001`](curriculum/gpu-mode-lecture-001/). The lessons run
   remotely in the NGC container; local Python environments are for editor
   feedback only. See [editor support](docs/brev/editor.md) for that setup.

No GPU is provisioned by `make check` or by reading these docs. Creating or
starting a VM incurs provider charges—use the dry-run and price-capped commands
in the onboarding guide first.

## What lives here

| Area | Purpose | Begin with |
| --- | --- | --- |
| [`curriculum/`](curriculum/) | GPU MODE lecture work, learner experiments, and generated run artifacts | [Curriculum guide](curriculum/README.md) |
| [`infra/brev/`](infra/brev/) | The infrastructure contract: Brev VM lifecycle helpers, guarded sync/watchdog scripts, and the NVIDIA NGC Compose workload | [Infrastructure rules](infra/brev/AGENTS.md) |
| [`docs/brev/`](docs/brev/) | Practical runbooks for getting compute, editing remotely, selecting hardware, and profiling | [Onboarding](docs/brev/onboarding.md) |
| [`TIL.md`](TIL.md) | Short, durable notes from the learning journey | [Today I Learned](TIL.md) |
| [`scripts/`](scripts/) | Local helpers for inspecting artifacts, including browser trace viewing | [Scripts guide](scripts/README.md) |

## The learning loop

This workspace is optimized for an intentional, ephemeral GPU session:

1. **Prepare locally.** Edit an exercise and use a lecture-local environment
   for syntax, type checking, and hover information.
2. **Acquire the right compute.** Search for a current Brev VM that meets the
   exercise's hardware and price requirements. The supported profiles and
   replacement criteria are in [hardware profiles](docs/brev/hardware-profiles.md).
3. **Synchronize and validate.** Copy the repository to the VM, start the
   watchdog, and run the smoke test before spending time on an experiment.
4. **Run, edit, and rerun.** Execute CUDA, PyTorch, Triton, and profiler work
   inside the pinned NVIDIA NGC container—not directly on the VM host.
5. **Measure and keep the result.** Store plots, traces, and reports under the
   lesson's `artifacts/` directory. Use the [Nsight Compute runbook](docs/brev/ncu.md)
   for the validated profiling path.
6. **Shut compute down.** Copy the artifacts you need, then stop the VM. The
   watchdog is a backstop, not a substitute for ending a session yourself.

## Cost-conscious by design

The goal is real GPU experience, not continuous cluster ownership. The
infrastructure favors stoppable VMs, fresh price searches, explicit hardware
requirements, a maximum runtime watchdog, reproducible containers, and local
evidence of each run. Review the [Brev decisions](docs/brev/decisions.md) for
the tradeoffs behind this design, and always review current provider pricing
before a live session.

## Curriculum and sources

The first lesson works through the GPU MODE Lecture 001 material, while this
repository provides the surrounding development workflow, run instructions,
experiments, and notes. Its precise upstream source, commit, license, and
retrieval date are recorded in [curriculum attribution](curriculum/UPSTREAM.md).

As the workspace grows, curriculum code, profiling artifacts, and TIL entries
should make the path from first kernel to performance engineering visible and
repeatable.
