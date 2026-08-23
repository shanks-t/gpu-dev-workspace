# GPU targets and pricing

Last refreshed: **2026-08-22**. Prices are USD per running hour for a one-GPU target and exclude persistent storage, taxes, and any optional networking charges. GCP rows include the host VM; RunPod rows include the Pod resources bundled with the GPU offer. Treat this as a selection guide, not a billing guarantee: RunPod prices and stock move with supply, and GCP Spot prices can change.

## Recommended progression

1. **RTX 3090 on RunPod Community** is the default `basics-cuda` lab. It provides 24 GB at the lowest current target price. It covers architecture-neutral exercises, not the book repository's Blackwell-only paths.
2. **RTX 4090 on RunPod Community** is the performance step-up for Ada, FP8, and stronger Tensor Core experiments while retaining a 24 GB memory limit.
3. **RTX 5090 on RunPod** is for Blackwell-specific behavior and 32 GB workloads, not routine development.
4. **A40 or RTX A6000 on RunPod Secure** is the economical 48 GB path. Prefer A40 when available; use L40S when Ada features matter.
5. **A100 80 GB or H100 on RunPod** is for memory-bound training, datacenter comparisons, or architecture-specific chapters. Do not use these for ordinary editor sessions.
6. **GCP T4** remains the reliable fallback. Add a GCP L4 profile when we are ready to maintain a G2-compatible image.

## Default capability boundary

The inexpensive default is designed for single-GPU CUDA C++, memory hierarchy, occupancy, streams, CUDA Graphs, PyTorch, `torch.compile`, Triton, inference, and profiling exercises that have portable implementations. The RunPod image matches the book repo's current CUDA 13.0 and PyTorch 2.9.1 baseline and includes Nsight Compute; `gpu up` reports whether Nsight Systems is present. The GCP image is the closest managed fallback at CUDA 12.9 and PyTorch 2.9.

The book repository also contains B200/B300 `sm_100` assumptions and exercises for TMA, thread-block clusters, FP8/FP4, Transformer Engine, NVLink/NVSwitch, GPUDirect, and distributed execution. A 3090 or T4 cannot validate those results. The cheapest currently available full `sm_100` RunPod target is a Secure B200 at **$6.79/hr** with low stock, so it belongs in a future explicit full-book profile rather than the default.

## RunPod Pods

These are the live `lowestPrice` results for one on-demand, non-interruptible GPU returned by RunPod's GraphQL catalog. `—` means no offer was returned for that cloud tier at refresh time. Stock is a point-in-time signal, not a reservation.

| Target | Terraform `gpu_type_id` | Architecture | VRAM | Community | Stock | Secure | Stock | Use |
| --- | --- | --- | ---: | ---: | --- | ---: | --- | --- |
| RTX A5000 | `NVIDIA RTX A5000` | Ampere | 24 GB | — | — | $0.27 | Low | Cheapest Secure Ampere lab |
| RTX 3090 | `NVIDIA GeForce RTX 3090` | Ampere | 24 GB | $0.22 | Low | $0.50 | Low | Default everyday lab |
| RTX 4090 | `NVIDIA GeForce RTX 4090` | Ada | 24 GB | $0.34 | Low | $0.74 | Medium | Fast single-GPU kernels and Ada features |
| RTX 5090 | `NVIDIA GeForce RTX 5090` | Blackwell | 32 GB | $0.69 | Medium | $0.99 | Medium | Blackwell-specific experiments |
| A40 | `NVIDIA A40` | Ampere | 48 GB | — | — | $0.44 | Medium | Best current 48 GB value |
| RTX A6000 | `NVIDIA RTX A6000` | Ampere | 48 GB | — | — | $0.53 | Medium | 48 GB workstation alternative |
| L40S | `NVIDIA L40S` | Ada | 48 GB | $0.79 | Low | $0.99 | Medium | 48 GB plus Ada features |
| A100 PCIe | `NVIDIA A100 80GB PCIe` | Ampere | 80 GB | $1.19 | Low | $1.39 | Low | Datacenter memory and bandwidth studies |
| A100 SXM | `NVIDIA A100-SXM4-80GB` | Ampere | 80 GB | $1.39 | Low | $1.59 | Medium | SXM/NVLink-specific comparisons |
| H100 SXM | `NVIDIA H100 80GB HBM3` | Hopper | 80 GB | — | — | $3.29 | High | Hopper, Transformer Engine, and FP8 |

RunPod marketplace machines with the same GPU can differ in host CPU, RAM, PCIe topology, storage, and reliability. Record those host details with benchmark results. Use Secure Cloud when repeatability matters more than the lowest price.

Sources: [RunPod Pod pricing](https://www.runpod.io/pricing), [RunPod GPU IDs and memory](https://docs.runpod.io/references/gpu-types), and [RunPod GraphQL GPU pricing query](https://docs.runpod.io/sdks/graphql/manage-pods#get-gpu-type-details).

## GCP Compute Engine (`us-west1`)

GCP prices below are complete VM compute prices: GPU plus the required vCPU and RAM. Persistent disk is additional. The first row matches the current Terraform configuration.

| Target machine | GPU | VRAM | Host shape | On-demand | Spot | Status |
| --- | --- | ---: | --- | ---: | ---: | --- |
| `n1-standard-4` + 1 T4 | Turing T4 | 16 GB | 4 vCPU, 15 GiB | $0.539999 | $0.279680 | Default Spot fallback |
| `g2-standard-4` | Ada L4 | 24 GB | 4 vCPU, 16 GiB | $0.706832 | $0.423956 | Next GCP profile |
| `a2-highgpu-1g` | Ampere A100 | 40 GB | 12 vCPU, 85 GiB | $3.673385 | $2.120810 | Serious GCP benchmark only |

The T4 is attached to a general-purpose N1 VM, so its total is the T4 accelerator price plus N1 CPU and RAM. G2 and A2 are accelerator-optimized shapes whose published machine prices already include their GPUs. GCP Spot capacity can be preempted and is unsuitable for an unsaved interactive session.

An H100 on GCP currently starts with an eight-GPU A3 shape, making it a poor fit for this single-GPU developer workspace. Use RunPod for isolated H100 work unless a production-like GCP cluster is the experiment itself.

Sources: [GCP GPU attachment pricing](https://cloud.google.com/products/compute/gpus-pricing), [GCP accelerator-optimized VM pricing](https://cloud.google.com/products/compute/pricing/accelerator-optimized), [GCP Spot pricing](https://cloud.google.com/spot-vms/pricing), and the [Cloud Billing Catalog API](https://cloud.google.com/billing/docs/reference/rest/v1/services.skus/list).

## Refresh the data

RunPod requires the restricted API key already stored in macOS Keychain:

```sh
RUNPOD_API_KEY="$(
  security find-generic-password \
    -a "$USER" \
    -s "runpod-gpu-workspace" \
    -w
)" ./scripts/fetch-gpu-prices runpod
```

GCP uses the active Application Default Credentials and reads public Compute Engine SKUs:

```sh
./scripts/fetch-gpu-prices gcp
```

The command prints TSV to standard output and does not modify this document. Review price or stock changes before updating the tables and refresh date.
