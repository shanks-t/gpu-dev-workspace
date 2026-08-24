# Brev hardware profiles

Live inventory and price are not versioned. Check them with `brev ls` and the
Brev Console; do not commit provider IDs or price quotes.

Choose a replacement from a fresh search, then review it against the approved
price ceiling:

```sh
# Fundamentals: one 16–24 GB GPU, compute capability 8.0+, 100 GB disk
brev search --json --min-vram 16 --min-capability 8.0 --min-disk 100 \
  --max-boot-time 7 --stoppable --sort price

# Profiling: one 48 GB GPU, compute capability 8.9+, 200 GB disk
brev search --json --min-vram 48 --min-capability 8.9 --min-disk 200 \
  --max-boot-time 10 --stoppable --sort price
```

With each benchmark artifact, record the GPU name, compute capability, driver,
CUDA, PyTorch, and Triton versions. This is enough to compare runs without
pinning a volatile provider machine.
