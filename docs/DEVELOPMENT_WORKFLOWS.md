# GPU Development Workflows

Zed can support two different development models. The important question is where the authoritative working copy lives while code is being edited.

## Mental model

| Concern | Remote-first | Local-first |
| --- | --- | --- |
| Authoritative working copy during the session | RunPod | MacBook |
| Zed project | SSH remote folder | Local folder |
| Zed integrated terminal | RunPod | MacBook |
| Build and execution | Directly on RunPod | On RunPod after synchronization |
| Edit-to-run synchronization | None | Required |
| Output location | Remote Zed terminal or SSH session | Local terminal/task invoking the remote command |
| Risk with an ephemeral Pod | Unpushed edits are deleted | Local source remains safe |

## Remote-first workflow

Use this when the code, compiler, dependencies, and GPU should all live in one remote environment.

### Start and open the workspace

From a local Ghostty terminal:

```sh
cd /Users/treyshanks/workspace/ai-performance/gpu-dev-workspace
./gpu up
./gpu zed
```

`gpu up` creates the Pod and seeds the committed repository into `/workspace/gpu-dev-workspace`. `gpu zed` opens that remote path over SSH. Zed's UI remains on the Mac, but the files, language servers, integrated terminal, tasks, and programs are on RunPod.

### Iterative edit/run loop

1. Create or open a file in the remote Zed project.
2. Edit and save it. The save writes directly to RunPod.
3. Run the file from Zed's integrated terminal or a Zed task.
4. Read stdout and stderr in that terminal.
5. Change the file, save it, and rerun the command.

For example, after creating `experiments/matmul.py` in Zed:

```sh
python3 experiments/matmul.py
```

No upload or synchronization occurs between editing and execution because both happen against the same remote filesystem.

Ghostty can also become a dedicated remote terminal:

```sh
ssh gpu-runpod
cd /workspace/gpu-dev-workspace
python3 experiments/matmul.py
```

The Zed terminal and the SSH-connected Ghostty terminal see the same files and processes.

### Preserving remote-first work

The current seed is a separate remote Git repository without an upstream remote or Git credentials. Before using remote-first development for valuable work, configure a safe way to return changes to the canonical repository. Options include:

- Configure an upstream Git remote and authenticate without copying a private key to the Pod.
- Export a patch and apply it locally.
- Add a dedicated `gpu pull` operation that retrieves changed files without Terraform state, credentials, caches, or build products.

The default `book-ephemeral` profile deletes the remote working copy on `gpu down`. Until a return path is implemented, treat remote-first as disposable experimentation or manually retrieve important changes before shutdown.

## Local-first workflow

Use this when the MacBook repository should remain the source of truth and the Pod should behave like a disposable execution target.

### Start the workspace

Open the local project in Zed:

```sh
cd /Users/treyshanks/workspace/ai-performance/gpu-dev-workspace
zed .
./gpu up
```

In this mode, editing and saving in Zed changes files on the Mac only. The Pod does not automatically see those changes.

### Iterative edit/run loop

The desired loop is:

1. Edit and save locally in Zed.
2. Synchronize the local working tree to `/workspace/gpu-dev-workspace` on the Pod.
3. Execute the requested command over SSH.
4. Stream remote stdout and stderr back to the local Zed task terminal or Ghostty.
5. Edit locally and repeat.

The current CLI does not yet automate step 2. A manual, non-deleting synchronization can be used during experimentation:

```sh
rsync -az \
  --exclude '.git/' \
  --exclude '.gpu/' \
  --exclude '.terraform/' \
  --exclude '*.tfstate*' \
  --exclude '*.tfvars' \
  ./ gpu-runpod:/workspace/gpu-dev-workspace/
```

Then execute remotely:

```sh
ssh gpu-runpod \
  'cd /workspace/gpu-dev-workspace && python3 experiments/matmul.py'
```

This intentionally omits `rsync --delete` so a path mistake cannot erase the remote workspace. Generated remote artifacts are not automatically copied back.

### Recommended CLI improvement

Add two small provider-independent operations:

```sh
./gpu sync
./gpu run python3 experiments/matmul.py
```

`gpu sync` should upload the working tree using a committed exclusion policy. `gpu run` should execute from the remote project root and preserve argument boundaries while streaming stdout, stderr, and the exit status to the caller.

A local Zed task could combine them:

```text
save locally -> gpu sync -> gpu run -> review output -> edit -> repeat
```

This would give local-first development the same short feedback loop as remote-first while keeping all source changes safe on the MacBook.

## Choosing a workflow

Choose remote-first when:

- Remote language servers, headers, and generated files materially improve editing.
- Most commands require the GPU environment.
- A persistent workspace or reliable Git return path is available.

Choose local-first when:

- The MacBook repository must remain authoritative.
- The Pod should be disposable and ephemeral by default.
- Most editing and static checks run locally, with only GPU execution delegated remotely.

For this project, local-first plus `gpu sync` and `gpu run` is likely the safer default once those operations exist. Remote-first remains valuable for profiling sessions and experiments that depend heavily on the remote CUDA environment.

