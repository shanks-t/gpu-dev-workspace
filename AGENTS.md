# Repository instructions

Use conventional commits with brief bullet points.

## Purpose and curriculum

This repository is a GPU development workspace for working through our own AI
performance-engineering curriculum. It provides reproducible remote GPU
environments, validation, and lifecycle controls; it is not a mirror of any
upstream course.

We may use external material as learning references, including:

- [CUDA MODE Lecture 001](https://github.com/gpu-mode/lectures/tree/main/lecture_001)
- [OLCF CUDA Training Series exercises](https://github.com/olcf/cuda-training-series/tree/master/exercises)

When using a reference, write our own exercises, notes, tests, and solutions in
this repository. Do not copy or vendor upstream source, generated artifacts, or
datasets unless a task explicitly authorizes it and its license and attribution
requirements have been reviewed. Keep reference repositories and learner work
outside container images; synchronize source separately into the workspace.

## RunPod credentials

- Use a dedicated RunPod key named `gpu-dev-workspace-macbook`.
- Set permission to **Restricted** with **Pods: Read/Write**. Leave Serverless endpoints, billing, registry authentication, and network volumes at **None** unless the repository starts managing them.
- Never use an **All access** key for this workspace.
- Never put the key in this repository, a Terraform variable, `.env`, `.zshrc`, or shell history. Never print or log it.

Store the key in the macOS login Keychain. Keeping `-w` last makes `security` prompt for the value instead of putting it in the command or shell history:

```sh
security add-generic-password \
  -U \
  -a "$USER" \
  -s "runpod-gpu-workspace" \
  -w
```

The CLI automatically retrieves this item for RunPod commands and exports it only inside its own process. It is inherited by Terraform and API requests but does not modify the parent terminal environment:

```sh
./gpu up
./gpu status
./gpu zed
```

An existing `RUNPOD_API_KEY` environment variable takes precedence, which supports CI and temporary credentials. Zed uses the API key only to resolve the current Pod endpoint; SSH authentication uses the configured private key. Revoke and replace either credential immediately if it is exposed.
