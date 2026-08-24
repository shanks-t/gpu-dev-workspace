# Exercise 01: establish and profile a PyTorch baseline

Start with [pytorch_square.py](pytorch_square.py). It compares three equivalent
ways to square a CUDA tensor:

```python
torch.square(x)
x * x
x ** 2
```

The goal is not to declare a winner from one timing. The goal is to prove what
work ran, where it ran, and what the profiler reports before writing a custom
kernel.

## Before running it

1. Start the lecture workspace and open an SSH shell as described in
   [README.md](README.md).
2. Enter this directory.
3. Record the GPU, driver, CUDA runtime, and PyTorch version:

   ```sh
   nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
   python -c 'import torch; print(torch.__version__, torch.version.cuda, torch.cuda.get_device_name())'
   ```

4. Predict the result: all three expressions should return the same values.
   They may not use the same ATen path or CUDA kernel, so do not assume equal
   timing before measuring.

## Run

```sh
python pytorch_square.py
```

The script already uses CUDA events and calls `torch.cuda.synchronize()` before
reading elapsed time. This matters because CUDA launches are asynchronous: a
plain CPU wall-clock measurement can stop before the GPU completes its work.

## Read the PyTorch profiler output

For each of the three profiler tables, identify:

1. The top-level ATen operation, such as `aten::square` or `aten::pow`.
2. The CUDA kernel name and its total CUDA time.
3. The number of launches.
4. Any unexpected host-to-device copy or synchronization.

The lecture uses `torch.square` to show how a familiar PyTorch operation maps
to an ATen operation and then to a generated CUDA elementwise kernel. Treat
template parameters in a kernel name as clues, not conclusions: confirm launch
dimensions and occupancy with Nsight Compute before attributing them to a
specific block or vector width.

## Capture a system trace

```sh
mkdir -p artifacts
nsys profile --force-overwrite true -o artifacts/pytorch-square python pytorch_square.py
```

In the resulting trace, look for the warmup region, CUDA kernel launches, and
whether CPU work is waiting for the GPU. The tensor is created directly on the
GPU before the timed functions, so a host-to-device transfer should not be the
steady-state cost of the three square expressions.

## Learning checkpoint

Write brief answers before moving to the inline-CUDA exercise:

- Why are CUDA events plus synchronization necessary here?
- Which Python expression maps to which ATen operation and CUDA kernel on this
  GPU?
- Does the trace contain one kernel launch per timed expression? If not, what
  else is visible?
- Is the bottleneck arithmetic, memory traffic, launch overhead, or something
  the evidence does not yet establish?

Keep the answers and any profiler artifacts under `artifacts/`; the retained
workspace volume preserves them between sessions.
