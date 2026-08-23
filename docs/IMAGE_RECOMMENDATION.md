# AI Performance Engineering image recommendation

## Recommendation

Use two RunPod images, not one oversized default:

| Profile | Image/template | Use for | Do not use for |
| --- | --- | --- | --- |
| `official-fundamentals` | RunPod-owned `runpod-torch-v280` template | Native CUDA, NumPy, and PyTorch CUDA fundamentals on the single RTX 3090 | Triton, reproducible profiler work, or any exercise with pinned package/toolchain requirements |
| `performance-full` | Immutable project GHCR image | Triton, Nsight Compute/Systems, the project smoke test, and pinned CUDA 13/PyTorch 2.9.1 work | Quick fundamentals sessions once the official template is validated faster |

This is a provisional routing recommendation, not yet a default change. Bare `./gpu up` remains `book-ephemeral` (`performance-full`) until both profiles complete two equivalent end-to-end trials. The initial results establish only that a RunPod-owned image can sometimes reach SSH quickly; they do not establish repeatable GPU-and-workspace readiness.

## Exercise routing

| Exercise set | Recommended profile | Why |
| --- | --- | --- |
| `gpu-dev-workspace/cuda/hello.cu` and CUDA C++ fundamentals | `official-fundamentals`, after its qualifying validation passes | Requires a usable GPU and `nvcc`, but no project-pinned compiler stack. |
| `cuda_examples` single-GPU memory, streams, occupancy, and CUDA Graph examples | `official-fundamentals`, where each example is portable to RTX 3090 | These teach CUDA mechanics and can compile with the provider toolchain. Use `performance-full` when collecting Nsight evidence. |
| AI Performance Engineering Chapters 1, 2, 3, 5, 6, 7, 8, 11, and 12 portable single-GPU paths | `official-fundamentals` only when the selected target uses native CUDA/NumPy/PyTorch alone | The RTX 3090 can teach the architecture-neutral concepts, but stored Blackwell expectations are not comparable. Profiler-backed paths require `performance-full`. |
| Triton, `torch.compile`, custom extensions, CUTLASS, or profiler-backed runs | `performance-full` | The official template's profiler availability is only probed, not assumed; it does not pin the project Triton/PyTorch/CUDA versions. |
| Chapters 9, 10, 13, 14, and 18 kernel/compiler/precision paths | `performance-full`, then a Blackwell-specific profile when the target needs Blackwell instructions | These paths import or depend on Triton, Transformer Engine, CUTLASS, or Blackwell-only features. |
| Chapters 4, 15, 16, 17, 19, and 20 distributed, NVLink/NVSwitch, serving, and case-study paths | `performance-full` plus a multi-GPU/Blackwell profile as required | A one-GPU RTX 3090 cannot validate NCCL topology, NVLink pooling, GPUDirect, or Blackwell-only claims. |
| TMA, thread-block clusters/DSMEM, tcgen05, FP8/FP4 Blackwell, GPUDirect Storage, and B200/B300 expectations | Dedicated Blackwell profile, not either RTX 3090 default | This is a hardware capability boundary, not an image choice. |

`performance-full` is intentionally a toolchain image, not a promise that every book dependency is installed. The book's `requirements_latest.txt` adds specialized libraries (for example Transformer Engine, vLLM, FlashInfer, and CUTLASS DSL) that should be split into future explicit workload profiles rather than added to the fundamentals image.

## Qualification and selection

Run each candidate once, fix any failed capability check, then run one more equivalent RTX 3090 Community trial:

```sh
./scripts/benchmark-runpod-startup 2 official-fundamentals performance-full
```

`official-fundamentals` must accept key-only SSH; run `nvidia-smi`; compile and execute the tracked CUDA smoke example; import NumPy and PyTorch; and complete a CUDA tensor operation. Its validation prints an explicit capability difference if `ncu` or `nsys` is unavailable. `performance-full` must also pass Triton and `gpu-image-smoke-test --gpu`.

Select `official-fundamentals` for bare `./gpu up` only if it passes those checks and its complete GPU-and-workspace readiness is comparable or faster in both trials. Keep `performance-full` as the advanced profile either way. Community cache residency and host placement are not guaranteed, so record host, datacenter, image/template identity, price, retained storage, and teardown result with each trial.

## Storage and credentials

`official-fundamentals` uses the official template's 30 GB container disk and 50 GB `/workspace` Pod volume. `./gpu down` stops compute and preserves the billable volume; `./gpu status` identifies it as retained and billable and reports the profile's current $10/month estimate; `./gpu cleanup` asks for confirmation and deletes it with the Pod. Refresh that estimate when RunPod storage pricing changes.

Before the `performance-full` trials, create a GHCR package token limited to package read access, register it with RunPod, and put only the resulting RunPod registry-authentication ID in ignored `infra/runpod/terraform.tfvars`. Do not use a GitHub token with package-write access. Confirm the exact immutable `sha-...` image can be pulled before treating its timing as comparable.
