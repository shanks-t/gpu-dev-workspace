# Remote Git workspace

The Brev VM workspace is a checkout of this repository, not an rsync mirror.
The checkout lives at `/home/ubuntu/workspace` and is mounted in the NGC
containers at `/workspace`.

## Chosen configuration

- Repository: `git@github.com:shanks-t/gpu-fundamentals.git`
- Branch: `remote`
- Authentication: the developer's local SSH agent is forwarded for the
  migration and for Git operations run through the Brev SSH connection.

Do not put a private key, access token, or credential helper configuration in
the repository, Docker image, notebook, or command output. Before a migration,
load the needed GitHub key into the local agent (for example, `ssh-add`) and
confirm it with the preflight command below.

## Ownership model

`ubuntu` owns `/home/ubuntu/workspace` and its `.git` directory. The NGC
services run with that user's numeric UID and GID (normally `1000:1000`), so
edits made from VS Code, Jupyter, or a container shell remain writable by the
same user. VS Code's container home is bind-mounted from
`/home/ubuntu/.devcontainer-home` so extension state is also user-writable.
Run `git` on the VM as `ubuntu`; do not use `sudo` or run Git from a root
container shell.

## One-time migration

The migration is intentionally split into inspection, backup, and replacement.
Each command requires the repository URL, branch, and auth mode explicitly.
Run the replacement only after reviewing preflight output and obtaining the
required approval.

```sh
infra/brev/scripts/git-workspace-preflight INSTANCE \
  --repo git@github.com:shanks-t/gpu-fundamentals.git \
  --branch remote --auth ssh-agent

infra/brev/scripts/git-workspace-backup INSTANCE \
  --output reports/brev/INSTANCE-workspace.tgz

infra/brev/scripts/git-workspace-migrate INSTANCE \
  --repo git@github.com:shanks-t/gpu-fundamentals.git \
  --branch remote --auth ssh-agent \
  --backup reports/brev/INSTANCE-workspace.tgz \
  --approve-replacement
```

The preflight refuses a locally dirty checkout, a remote Git checkout with
uncommitted work, unavailable SSH-agent authentication, or a destination the
migration cannot safely replace. The backup is an archive of the old remote
workspace, excluding `.git`. Migration renames the old workspace, clones the
selected branch, restores only files that do not already exist in the checkout,
and writes `.brev-migration.json` with the selected commit and branch.

## Daily remote-first workflow

1. Start or choose an approved VM and run `brev refresh`.
2. Connect with VS Code Remote SSH, open `/home/ubuntu/workspace`, and reopen
   it in the NGC Dev Container; or start Jupyter with
   `infra/brev/scripts/notebook INSTANCE`.
3. Edit under `/workspace`. In the VM shell, review and commit as `ubuntu`:

   ```sh
   cd /home/ubuntu/workspace
   git status
   git diff
   git add PATHS
   git commit -m "type: summary"
   git push origin remote
   ```

4. On the Mac, retrieve the work with `git pull --ff-only origin remote`.

`sync-source` has been retired. It is unsafe with a Git checkout because its
delete-based rsync would remove Git metadata and overwrite remote edits.
