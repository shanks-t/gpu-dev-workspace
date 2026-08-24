# Brev decisions

- **VM mode:** Brev owns SSH, editor access, and workspace persistence; NGC is only the Docker workload.
- **Profiles:** tracked JSON renders documented CLI commands and is desired state, not a Terraform/Pulumi provider.
- **Launchables:** an optional console-managed sharing layer to evaluate after live validation; any settings are mirrored in docs, never source of truth.
- **MCP research:** no supported Brev infrastructure-control MCP was found. Do not use undocumented APIs.
- **CUDA docs MCP:** users may configure `https://api.copilot.nsight.ngc.nvidia.com/mcp/cuda-docs` with their own NVIDIA Developer login. It is documentation-only and must receive no Brev or NGC secret.
