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

Retrieve it only into the environment of the command that needs it:

```sh
RUNPOD_API_KEY="$(
  security find-generic-password \
    -a "$USER" \
    -s "runpod-gpu-workspace" \
    -w
)" ./gpu up
```

Use the same pattern for `./gpu status`, `./gpu down`, and `./gpu destroy`. Revoke and replace the key immediately if it is exposed.
