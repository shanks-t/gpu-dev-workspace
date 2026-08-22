#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

fake_bin=$test_root/bin
fake_home=$test_root/home
tf_log=$test_root/terraform.log
tf_state=$test_root/applied
mkdir -p "$fake_bin" "$fake_home/.ssh"

cat >"$fake_bin/terraform" <<'EOF'
#!/bin/sh
printf '%s\n' "$*" >>"$GPU_TEST_TF_LOG"
case " $* " in
  *" output -json "*)
    if [ -f "$GPU_TEST_TF_STATE" ]; then
      printf '%s\n' '{"pod_id":{"value":"pod-test","type":"string"}}'
    else
      printf '%s\n' '{}'
    fi
    ;;
  *" apply "*) touch "$GPU_TEST_TF_STATE" ;;
esac
EOF
cat >"$fake_bin/curl" <<'EOF'
#!/bin/sh
printf '%s\n' '{"publicIp":"203.0.113.10","portMappings":{"22":10022}}'
EOF
printf '%s\n' '#!/bin/sh' 'exit 0' >"$fake_bin/ssh"
chmod +x "$fake_bin/terraform" "$fake_bin/curl" "$fake_bin/ssh"

printf '%s\n' test-private-key >"$fake_home/.ssh/gpu_dev_ed25519"

HOME=$fake_home \
  PATH=$fake_bin:$PATH \
  GPU_TEST_TF_LOG=$tf_log \
  GPU_TEST_TF_STATE=$tf_state \
  RUNPOD_API_KEY=test-api-key \
  RUNPOD_SSH_KEY=$fake_home/.ssh/gpu_dev_ed25519 \
  "$root/gpu" up book-persistent >/dev/null

grep -Fq -- '-var-file='"$root"'/profiles/book-persistent/runpod.tfvars' "$tf_log"

echo 'gpu profile test passed'
