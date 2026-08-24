# SRAM vs. DRAM on GPUs

**Learned:** SRAM and DRAM both store data for GPU programs, but their cell
designs create a fundamental capacity-versus-latency tradeoff. Tiling aims to
move data from large, relatively slow DRAM into small, fast SRAM and reuse it
there.

## The storage cells

**SRAM** means *static random-access memory*. A common SRAM bit cell uses six
transistors: two cross-coupled inverters (four transistors) that hold the bit,
plus two access transistors. As long as it has power, it holds its value
without a periodic refresh.

**DRAM** means *dynamic random-access memory*. A common DRAM bit cell has one
transistor and one capacitor. The capacitor's charge encodes the bit, but the
charge leaks, so DRAM must be refreshed periodically.

SRAM cells are larger and more expensive per bit, so they are not practical for
the GPU's largest memory. DRAM cells are much denser, enabling high-capacity
memory, but are slower to access.

## Where they appear on a GPU

| Memory | Typical GPU role | Main tradeoff |
| --- | --- | --- |
| SRAM | Registers, shared memory, and caches | Small and low-latency |
| DRAM | Global memory, commonly HBM | Large capacity and higher latency |

DRAM is arranged in banks, rows, and columns. Access may require selecting and
activating a row, then selecting columns within it; switching to a different
row can add further delay. Refresh contributes overhead too, although it is
only one part of why a DRAM access is slower.

## What “close to compute” means

Calling SRAM “close to compute” has both a physical and architectural meaning.

- **Physically close:** Registers and shared memory are implemented in, or
  immediately alongside, each streaming multiprocessor (SM). GPU arithmetic
  units reach them over short, dedicated on-chip wires.
- **Architecturally close:** Reaching SRAM requires fewer layers of routing and
  control. A DRAM request travels through the memory hierarchy, on-chip
  interconnect, and memory controllers before its row and column are accessed.

HBM can be very near the GPU package, but it remains much farther from an SM's
arithmetic units than SRAM. Its longer, more coordinated access path takes
many more cycles.

## The Triton implication

In Triton, `tl.load` usually brings input data from global DRAM into values
used by a program instance. Good kernel structure then reuses those values in
registers, caches, or shared-memory-like on-chip storage before storing the
result. Tiling is valuable because it replaces repeated expensive DRAM reads
with cheap local reuse.

**Follow-up:** When profiling a tiled Triton kernel, compare the number of
global-memory loads before and after increasing reuse within a tile.

**Reference:** [SRAM vs. DRAM video](https://www.youtube.com/watch?v=ammQYLcyebA).
