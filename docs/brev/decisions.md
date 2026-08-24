# Brev decisions

- **VM mode:** Brev owns SSH, editor access, and workspace persistence; NGC is only the Docker workload.
- **Direct CLI:** documented `brev` commands are the control surface. `infra/brev/AGENTS.md` records hardware targets and cost rules; it is guidance, not a Terraform/Pulumi provider.
- **NGC execution:** run CUDA, Triton, and profiler commands through `infra/brev/compose/ngc-pytorch.compose.yaml`, with `/home/ubuntu/workspace` mounted at `/workspace`. The VM host provides lifecycle, SSH, and persistent storage only.
- **Nsight Compute:** use `docker compose run --cap-add SYS_ADMIN` for `ncu`; this grants the profiler access to GPU performance counters without changing the VM driver's global counter-access policy. Capture reports in the lesson's `artifacts/` directory and retrieve them with `brev copy`. See [`ncu.md`](ncu.md).
- **Launchables:** an optional console-managed sharing layer to evaluate after live validation; any settings are mirrored in docs, never source of truth.
- **MCP research:** no supported Brev infrastructure-control MCP was found. Do not use undocumented APIs.
- **CUDA docs MCP:** users may configure `https://api.copilot.nsight.ngc.nvidia.com/mcp/cuda-docs` with their own NVIDIA Developer login. It is documentation-only and must receive no Brev or NGC secret.
