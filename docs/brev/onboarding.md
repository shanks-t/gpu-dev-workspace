# Brev + NGC onboarding

Use a Brev VM for SSH and persistent workspace storage, and run GPU work in
the pinned NVIDIA NGC container.

## Set up and choose a VM

```sh
brew install brevdev/homebrew-brev/brev
brev login
```

Use [the VM selection guide](instance-selection.md) next. It prefers a suitable
stopped VM, and covers searching, reviewing, and creating a new one only when
needed.

Codex users should use the installed `brev-cli` skill for Brev and NGC tasks.
For installation and updates, see NVIDIA's [CLI-with-agents guide](https://docs.nvidia.com/brev/guides/ai-agents/cli-with-agents).

## Start a session

After choosing or starting `INSTANCE`:

```sh
brev refresh
infra/brev/scripts/sync-source INSTANCE
infra/brev/scripts/watchdog INSTANCE 120 --confirm-watchdog
infra/brev/scripts/smoke INSTANCE
```

Keep the repository open locally in Zed, edit there, sync it, and rerun on the
VM. [Zed and VM editing](editor.md) has the complete loop.

## Run GPU work

Do not run CUDA, Triton, or profiling commands on the VM host. Use NGC:

```sh
brev shell INSTANCE
cd /home/ubuntu/workspace
docker compose -f infra/brev/compose/ngc-pytorch.compose.yaml run --rm pytorch -lc \
  'cd curriculum/gpu-mode-lecture-001 && python pytorch_square.py'
```

Store artifacts under the lesson's `artifacts/` directory. For Nsight Compute,
see [the profiling guide](ncu.md).

## Credentials and cleanup

- Save the NGC key in the macOS Keychain; `infra/brev/scripts/ngc-login INSTANCE`
  streams it into the remote Docker login without exposing it on the command line.
- Do not enable shell tracing or record credential output.
- Stopping preserves the workspace but can retain storage cost; deletion removes
  it. Stop the VM when finished and keep the watchdog as a backstop.
