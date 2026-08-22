#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

fake_bin=$test_root/bin
fake_home=$test_root/home
mkdir -p "$fake_bin" "$fake_home/.ssh"

printf '%s\n' '#!/bin/sh' 'printf "%s\n" '\''{"pod_id":{"value":"pod-test","type":"string"}}'\''' >"$fake_bin/terraform"
printf '%s\n' '#!/bin/sh' 'printf "%s\n" '\''{"publicIp":"203.0.113.10","portMappings":{"22":10022}}'\''' >"$fake_bin/curl"
printf '%s\n' '#!/bin/sh' 'exit 0' >"$fake_bin/ssh"
# The generated fake expands $1 when Zed invokes it, not while this test writes it.
# shellcheck disable=SC2016
printf '%s\n' '#!/bin/sh' 'printf "%s\n" "$1"' >"$fake_bin/zed"
chmod +x "$fake_bin/terraform" "$fake_bin/curl" "$fake_bin/ssh" "$fake_bin/zed"

printf '%s\n' 'Host old-node' '    HostName 192.0.2.1' >"$fake_home/.ssh/config"
printf '%s\n' test-private-key >"$fake_home/.ssh/gpu_dev_ed25519"

output=$(
  HOME=$fake_home \
    PATH=$fake_bin:$PATH \
    RUNPOD_API_KEY=test-api-key \
    RUNPOD_SSH_KEY=$fake_home/.ssh/gpu_dev_ed25519 \
    "$root/gpu" zed
)

config=$fake_home/.ssh/config
alias_config=$fake_home/.ssh/config.d/gpu-workspace-runpod

[ "$(sed -n '1p' "$config")" = 'Include ~/.ssh/config.d/gpu-workspace-*' ]
grep -Fq 'Host old-node' "$config"
grep -Fq 'Host old-node' "$fake_home/.ssh/config.gpu-workspace.bak"
if grep -Fq 'Include ~/.ssh/config.d/gpu-workspace-*' "$fake_home/.ssh/config.gpu-workspace.bak"; then
  echo 'backup unexpectedly contains the managed Include' >&2
  exit 1
fi
grep -Fq 'Host gpu-runpod' "$alias_config"
grep -Fq 'HostName 203.0.113.10' "$alias_config"
grep -Fq 'Port 10022' "$alias_config"
grep -Fq "IdentityFile \"$fake_home/.ssh/gpu_dev_ed25519\"" "$alias_config"
ssh -F "$alias_config" -G gpu-runpod >/dev/null 2>&1
printf '%s\n' "$output" | grep -Fq 'ssh://gpu-runpod/workspace/gpu-dev-workspace'

echo 'gpu alias test passed'
