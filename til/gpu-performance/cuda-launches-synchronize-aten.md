# CUDA launches, synchronization, and ATen

**Learned:** A PyTorch GPU expression usually passes through an ATen operation
before it becomes work performed by a CUDA kernel.

## The three layers

The Lecture 001 baseline compares these three expressions from
[`pytorch_square.py`](../../curriculum/gpu-mode-lecture-001/pytorch_square.py):

```python
torch.square(b)
b * b
b ** 2
```

- **PyTorch** is the Python interface we write.
- **ATen** is PyTorch's tensor-operation layer. The profiler may show names
  such as `aten::square`, `aten::pow`, or `aten::mul`.
- **CUDA** runs a kernel on the GPU. For squaring, that kernel applies the
  same independent operation to many tensor elements.

The Python spelling is not enough to predict the implementation. In Lecture
001, `torch.square(x)` can show an underlying `aten::pow` path, while `x * x`
shows `aten::mul`. Profiling reveals what this particular PyTorch build and
GPU actually did.

## Kernel launches are asynchronous

Calling a CUDA operation generally queues work and returns control to the CPU
before the GPU has finished. The CPU's request to start that work is a **kernel
launch**. A CPU timer around only the Python call can therefore measure the
queueing request instead of the complete GPU operation.

Lecture 001 measures those expressions with CUDA events, not a plain Python
timer:

```python
start = torch.cuda.Event(enable_timing=True)
end = torch.cuda.Event(enable_timing=True)

for _ in range(5):                 # warm up the GPU path
    func(input)

start.record()
func(input)                        # queues the CUDA kernel
end.record()
torch.cuda.synchronize()           # wait before reading the result
milliseconds = start.elapsed_time(end)
```

`torch.cuda.synchronize()` is a device-wide wait from the CPU's point of view.
Here it makes sure `end.elapsed_time(...)` is read only after the queued GPU
work is done. The CUDA events give the elapsed time on the GPU's timeline,
which is the point of this lesson. Synchronizing after every operation in a
real workload can prevent useful CPU/GPU overlap, so use it deliberately.

## Reading this lecture's profiler output

The same file profiles each form separately:

```python
with torch.profiler.profile() as prof:
    torch.square(b)

print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=10))
```

On our run, the `torch.square(b)` table showed `aten::square`, then
`aten::pow`, and a `vectorized_elementwise_kernel`; `b * b` showed
`aten::mul`. That is a concrete reminder that the Python spelling does not
fully describe the ATen path or kernel that ran. Re-run the lecture file on a
different PyTorch version or GPU and treat its profiler output as the source
of truth.

**Source:** [GPU MODE Lecture 001 `pytorch_square.py`](../../curriculum/gpu-mode-lecture-001/pytorch_square.py), copied from the upstream lecture materials recorded in
[`UPSTREAM.md`](../../curriculum/UPSTREAM.md).

**Follow-up:** Compare `torch.square(x)`, `x * x`, and `x ** 2` in the profiler,
then check whether each expression launches one kernel and which ATen path it
uses.
