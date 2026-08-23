#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

fake_bin=$test_root/bin
fake_home=$test_root/home
mkdir -p "$fake_bin" "$fake_home/.ssh"

printf '%s\n' '#!/bin/sh' 'printf "%s\n" '\''{"pod_id":{"value":"pod-test","type":"string"}}'\''' >"$fake_bin/terraform"
printf '%s\n' '#!/bin/sh' 'printf "%s\n" '\''{"id":"pod-test","publicIp":"","portMappings":null}'\''' >"$fake_bin/curl"
chmod +x "$fake_bin/terraform" "$fake_bin/curl"

if output=$(HOME=$fake_home PATH=$fake_bin:$PATH RUNPOD_API_KEY=test-api-key "$root/gpu" ssh 2>&1); then
  echo 'gpu ssh unexpectedly accepted a Pod without direct SSH' >&2
  exit 1
fi

printf '%s\n' "$output" | grep -Fq 'has no public TCP port 22 endpoint'
printf '%s\n' "$output" | grep -Fq 'interactive SSH proxy'
printf '%s\n' "$output" | grep -Fq 'no running direct SSH endpoint'

echo 'gpu direct SSH test passed'
