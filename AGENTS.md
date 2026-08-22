# Repository instructions

Use conventional commits with brief bullet points.

## RunPod credentials

- Use a dedicated RunPod key named `gpu-dev-workspace-macbook`.
- Set permission to **Restricted** with **Pods: Read/Write**. Leave Serverless endpoints, billing, registry authentication, and network volumes at **None** unless the repository starts managing them.
- Never use an **All access** key for this workspace.
- Never put the key in this repository, a Terraform variable, `.env`, `.zshrc`, or shell history. Never print or log it.

Store the key in the macOS login Keychain. Keeping `-w` last makes `security` prompt for the value instead of putting it in the command or shell history:

```sh
security add-generic-password \
  -U \
  -a "$USER" \
  -s "runpod-gpu-workspace" \
  -w
```

The CLI automatically retrieves this item for RunPod commands and exports it only inside its own process. It is inherited by Terraform and API requests but does not modify the parent terminal environment:

```sh
./gpu up
./gpu status
./gpu zed
```

An existing `RUNPOD_API_KEY` environment variable takes precedence, which supports CI and temporary credentials. Zed uses the API key only to resolve the current Pod endpoint; SSH authentication uses the configured private key. Revoke and replace either credential immediately if it is exposed.
