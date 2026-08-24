# Start with the measurement question

**Learned:** Before changing GPU code, define the performance metric, workload,
and baseline you will compare.

**Why it matters:** A faster isolated kernel can make the real workload slower,
or simply move the bottleneck elsewhere.

## Record the experiment contract

Capture the input shapes, precision, GPU model, software versions, warm-up
count, and timing method beside every result.

```python
import time
import torch

def benchmark(fn, *args, warmup=10, iterations=100):
    for _ in range(warmup):
        fn(*args)
    torch.cuda.synchronize()

    started = time.perf_counter()
    for _ in range(iterations):
        fn(*args)
    torch.cuda.synchronize()

    return (time.perf_counter() - started) / iterations
```

Use the same contract for the baseline and proposed implementation, then report
the metric in context (for example, average milliseconds per iteration for a
specific input shape).

**Source:** Workspace experiments and profiling notes.

**Follow-up:** Add the first result from an actual profiling session.
