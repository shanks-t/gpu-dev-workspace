# Repository instructions

Use conventional commits with brief bullet points.

## Today I Learned entries

When a user asks to capture a learning, create one Markdown file in the
appropriate `til/<topic>/` directory, then add its title, link, and date to the
table of contents in `TIL.md`. Include a minimal reproducible code or command
example when useful.

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

## Brev and NGC credentials

- Never place Brev credentials, NGC API keys, instance IDs, costs, or provider resource IDs in Git, config files, shell history, images, or logs.
- Store an NGC API key only in the macOS login Keychain as service `ngc-api-key`. Retrieve it only with `infra/brev/scripts/ngc-login`, which streams it to Docker with `--password-stdin`.
- Brev authentication is interactive (`brev login`) and managed below `~/.brev/`. Use `brev refresh` before SSH, rsync, or after a stopped instance restarts.
