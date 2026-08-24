# Choosing a GPU development VM

Use this guide when no suitable stopped VM is available. First run
`brev ls`; a compatible stopped VM is preferred because it starts faster than a
new VM and retains its persistent `/home/ubuntu/workspace` data.

Starting a stopped VM incurs runtime cost, so obtain approval before running
`brev start`. After it starts, run `brev refresh` before connecting or syncing.

## Find new candidates

When a new VM is necessary, search for one 16–24 GB GPU with compute
capability 8.0 or newer, 100 GB disk, stoppable capacity, and an hourly cost
at or below $1.50:

```sh
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 --stoppable \
  | jq '[.[] | select(.price_per_hour <= 1.50)]
        | sort_by(.price_per_hour, .boot_time_seconds)
        | .[:5]'
```

The command returns at most five candidates. It ranks by hourly price first
and uses boot time as a tie-breaker. This is a local `jq` ranking because Brev
supports only one native `--sort` field and no maximum-price filter.

The output is live inventory, so provider, instance type, capacity, boot time,
and price will vary. Each result includes fields such as:

```json
{
  "type": "<instance type>",
  "provider": "<cloud provider>",
  "gpu_name": "<GPU model>",
  "gpu_count": 1,
  "vram_per_gpu_gb": 24,
  "capability": 8.9,
  "target_disk_gb": 100,
  "boot_time_seconds": 420,
  "stoppable": true,
  "price_per_hour": "<live hourly price>"
}
```

Review a candidate with a dry run before requesting approval to create it:

```sh
brev create INSTANCE --min-vram 16 --min-capability 8.0 --min-disk 100 \
  --stoppable --sort price --dry-run
```

After approval, remove `--dry-run` and add `--timeout 420`. Do not commit live
provider identities, capacity, or price quotes to the repository.
