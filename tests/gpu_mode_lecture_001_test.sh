#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
profile=$root/profiles/gpu-mode-lecture-001/runpod.tfvars
lecture=$root/curriculum/gpu-mode-lecture-001

grep -Eq '^profile_name[[:space:]]*=[[:space:]]*"gpu-mode-lecture-001"$' "$profile"
grep -Eq '^persistent_storage[[:space:]]*=[[:space:]]*true$' "$profile"
grep -Eq '^validation_mode[[:space:]]*=[[:space:]]*"performance-full"$' "$profile"
grep -Eq '^image_name[[:space:]]*=[[:space:]]*"ghcr.io/shanks-t/gpu-dev-workspace:0.1.1"$' "$profile"

for file in LICENSE README.md UPSTREAM.md hello_load_inline.py load_inline.py \
  numba_square.py pt_profiler.py pytorch_square.py triton_square.py; do
  [ -f "$lecture/$file" ] || {
    echo "GPU MODE Lecture 001 file missing: $file" >&2
    exit 1
  }
done

python3 -m py_compile "$lecture"/*.py
echo 'GPU MODE Lecture 001 test passed'
