# Fundamentals Brev VM

The supported compute environment is the **Fundamentals VM** (`gpu-fundamentals`): a Brev-managed VM for SSH and persistent `/home/ubuntu/workspace`, with NVIDIA NGC used only as the Docker workload.

## Brev and NGC work

The `brev-cli` skill is installed through a Codex plugin. Use that skill for all Brev and NGC-related tasks, including finding or managing the VM, connecting to it, syncing source, and running the NGC workload.

## Hardware target

Use one 16–24 GB GPU with compute capability 8.0 or newer, 100 GB disk, stoppable capacity, and a boot time of at most seven minutes:

```sh
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price
brev create gpu-fundamentals --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price --dry-run
```

Brev has a minimum-VRAM filter but no maximum-VRAM filter. Manually select a result with no more than 24 GB per GPU; do not silently pin a provider because capacity and price are live inputs.

After fresh approval, remove `--dry-run` and add `--timeout 420` to create the VM.

## Cost and lifecycle controls

- Do not select a result above **$1.50/hour**; maximum runtime is **120 minutes**.
- Creating the VM, changing the price ceiling, or extending the runtime deadline needs fresh user approval. Always review the `--dry-run` output before a live `brev create`.
- Immediately after a live create, run `brev refresh`, schedule `scripts/watchdog gpu-fundamentals 120 --confirm-watchdog`, and write local billing and cleanup evidence below ignored `reports/brev/`.
- Stop the VM when finished. Delete disposable test VMs after saving evidence; a stopped VM can retain billable storage and may lose capacity on restart.

Use `scripts/sync-source`, `scripts/ngc-login`, and `scripts/smoke` for their focused operations. Run CUDA, Triton, and profiling commands through the pinned NGC Compose workload, not directly on the VM host.
