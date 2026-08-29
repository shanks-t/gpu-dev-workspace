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

Keep the repository open locally, edit there, sync it, and rerun on the VM.
For VS Code and Dev Container setup, see [editor support](editor.md).

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

## Run JupyterLab

JupyterLab runs in the same pinned NGC container as the lesson scripts. Do not
install PyTorch or Jupyter kernels into the VM host Python environment.

Start the notebook container from the Mac:

```sh
infra/brev/scripts/notebook INSTANCE
```

In a second local terminal, create the SSH tunnel:

```sh
brev port-forward INSTANCE -p 8888:8888
```

Open <http://localhost:8888>. The container port is bound to `127.0.0.1` on
the VM, so it is reachable only through the authenticated SSH tunnel.

## Open the VS Code workspace

Start the NGC notebook container, then open the remote workspace:

```sh
infra/brev/scripts/notebook INSTANCE
brev open INSTANCE code --dir /home/ubuntu/workspace
```

In VS Code, run **Dev Containers: Reopen in Container**. This opens
`/workspace` inside the same NGC image used by the lesson scripts. The first
connection installs the Python and Jupyter extensions; later container rebuilds
reuse their Docker volumes. See [editor support](editor.md) for details.

## Credentials and cleanup

- Save the NGC key in the macOS Keychain; `infra/brev/scripts/ngc-login INSTANCE`
  streams it into the remote Docker login without exposing it on the command line.
- Do not enable shell tracing or record credential output.
- Stopping preserves the workspace but can retain storage cost; deletion removes
  it. Stop the VM when finished and keep the watchdog as a backstop.
