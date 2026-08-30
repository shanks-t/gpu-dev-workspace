# Brev development VM

The supported compute environment is a Brev-managed VM for SSH and persistent `/home/ubuntu/workspace`, with NVIDIA NGC used only as the Docker workload.

## Brev and NGC work

The `brev-cli` skill is installed through a Codex plugin. Use that skill for all Brev and NGC-related tasks, including finding or managing the VM, connecting to it, syncing source, and running the NGC workload.

## Reuse a stopped VM first

Before searching for or creating a VM, run `brev ls` and look for a compatible stopped VM. Prefer starting that VM, after fresh approval to incur its runtime cost: starting is faster than provisioning and preserves its `/home/ubuntu/workspace` data. Run `brev refresh` after it starts.

Use the candidate-search command below only when no suitable stopped VM exists or when the existing VM cannot meet the task's requirements. Do not create a replacement while a suitable stopped VM is available.

## Hardware target

Use one 16–24 GB GPU with compute capability 8.0 or newer, 100 GB disk, and stoppable capacity. Boot time is a preference, not an eligibility requirement. The selected instance must cost no more than **$1.50/hour**:

```sh
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --stoppable --sort price \
  | jq '[.[] | select(.price_per_hour <= 1.50)]
        | sort_by(.price_per_hour, .boot_time_seconds)
        | .[:5]'
brev create INSTANCE --min-vram 16 --min-capability 8.0 --min-disk 100 --stoppable --sort price --dry-run
```

Brev does not have a maximum-price flag. The search above is the agent's discovery command for new instances: it filters to the **$1.50/hour** cap, ranks candidates by price and then boot time, and shows at most the five cheapest candidates. Brev also has a minimum-VRAM filter but no maximum-VRAM filter. Manually select a result with no more than 24 GB per GPU; do not silently pin a provider because capacity and price are live inputs. For the supported editor, container, and Git loop, see [`docs/brev/workspace.md`](../../docs/brev/workspace.md).

After fresh approval, remove `--dry-run` and add `--timeout 420` to create the VM.

## Cost and lifecycle controls

- Do not select a result above **$1.50/hour**; maximum runtime is **120 minutes**.
- Creating the VM, changing the price ceiling, or extending the runtime deadline needs fresh user approval. Always review the `--dry-run` output before a live `brev create`.
- Immediately after a live create, run `brev refresh`, schedule `scripts/watchdog INSTANCE 120 --confirm-watchdog`, and write local billing and cleanup evidence below ignored `reports/brev/`.
- Stop the VM when finished. Delete disposable test VMs after saving evidence; a stopped VM can retain billable storage and may lose capacity on restart.

Use `scripts/git-workspace-preflight`, `scripts/git-workspace-backup`, and
`scripts/git-workspace-migrate` for the one-time Git checkout migration, and
`scripts/open-workspace`, `scripts/ngc-login`, and `scripts/smoke` for their
focused operations. `open-workspace INSTANCE --confirm-start` is the supported
remote-first editor entry point; it configures the remote checkout's Git author
identity and starts the NGC Jupyter GPU runtime. Use Remote SSH only; do not
attach VS Code to the Docker container.

When a user asks to commit remote workspace changes, inspect `git status` and
`git diff` in `/home/ubuntu/workspace`, stage only the files the user intended
to include, commit on branch `remote`, and push `origin remote`. Do not stage
`.brev-migration.json` or restored untracked learner files without explicit
user direction. Run CUDA, Triton, and profiling commands through the pinned
NGC Compose workload, not directly on the VM host.
