#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

fake_bin=$test_root/bin
fake_home=$test_root/home
mkdir -p "$fake_bin" "$fake_home/.ssh"

for command_name in terraform curl jq ssh; do
  printf '%s\n' '#!/bin/sh' 'exit 0' >"$fake_bin/$command_name"
  chmod +x "$fake_bin/$command_name"
done
printf '%s\n' '#!/bin/sh' 'printf "%s\\n" test-api-key' >"$fake_bin/security"
chmod +x "$fake_bin/security"
printf '%s\n' test-private-key >"$fake_home/.ssh/gpu_dev_ed25519"

output=$(HOME=$fake_home PATH=$fake_bin:$PATH "$root/gpu" doctor basics-cuda)
printf '%s\n' "$output" | grep -Fq 'gpu doctor: ready'
printf '%s\n' "$output" | grep -Fq 'found profile profiles/basics-cuda/runpod.tfvars'

profiles=$(PATH=$fake_bin:$PATH "$root/gpu" profiles)
printf '%s\n' "$profiles" | grep -Fxq basics-cuda
printf '%s\n' "$profiles" | grep -Fxq gpu-mode-lecture-001

gcp_profiles=$(PATH=$fake_bin:$PATH GPU_PROVIDER=gcp "$root/gpu" profiles)
printf '%s\n' "$gcp_profiles" | grep -Fxq basics-cuda

echo 'gpu doctor test passed'
