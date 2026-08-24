# Brev GPU targets and cost controls

Use the NVIDIA Brev CLI directly

## Search targets

| Session | Target | Direct search |
| --- | --- | --- |
| Fundamentals | One 16–24 GB GPU, compute capability 8.0+, 100 GB disk, stoppable, boot in at most seven minutes | `brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price` |
| Profiling | One 48 GB GPU, compute capability 8.9+, 200 GB disk, stoppable, boot in at most ten minutes | `brev search --json --min-vram 48 --min-capability 8.9 --min-disk 200 --max-boot-time 10 --stoppable --sort price` |

Brev has a minimum-VRAM filter but no maximum-VRAM filter. For fundamentals, manually select a result with no more than 24 GB per GPU. Do not silently pin a provider: capacity and price are live inputs.

## Create previews

```sh
brev create gpu-fundamentals --min-vram 16 --min-capability 8.0 --min-disk 100 --max-boot-time 7 --stoppable --sort price --dry-run
brev create gpu-profiling --min-vram 48 --min-capability 8.9 --min-disk 200 --max-boot-time 10 --stoppable --sort price --dry-run
```

After fresh approval, remove `--dry-run` and add `--timeout 420` for fundamentals or `--timeout 600` for profiling.

## Cost controls

- Fundamentals: do not select a result above **$1.50/hour**; maximum runtime is **120 minutes**.
- Profiling: do not select a result above **$4.00/hour**; maximum runtime is **180 minutes**.
- Creating, changing a price ceiling, or extending a runtime deadline needs fresh user approval. Always run the corresponding `brev create ... --dry-run` command and review its results before a live `brev create`.
- Immediately after a live create, run `brev refresh`, schedule `scripts/watchdog INSTANCE MINUTES --confirm-watchdog`, and write local billing/cleanup evidence below ignored `reports/brev/`.
- Stop when finished. Delete disposable test instances after evidence is saved. A stopped instance can retain billable storage and may lose capacity on restart.

The VM owns SSH and `/home/ubuntu/workspace`; NGC is only the Docker workload. Use `scripts/sync-source`, `scripts/ngc-login`, and `scripts/smoke` for those focused operations.
