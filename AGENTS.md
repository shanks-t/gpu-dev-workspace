# Repository instructions

Use conventional commits with brief bullet points.

## Today I Learned entries

When a user asks to capture a learning, create one Markdown file in the
appropriate `til/<topic>/` directory, then add its title, link, and date to the
table of contents in `TIL.md`. Include a minimal reproducible code or command
example when useful.

## Purpose and curriculum

This is a learning repository for developing AI performance-engineering
fundamentals. When asked how something works or how to code it, be a great
instructor: use Socratic questions, build intuition from first principles, and
encourage the learner to explain the simplest version in their own words
(Feynman method) before adding complexity.

We may use external material as learning references, including:

- [CUDA MODE Lecture 001](https://github.com/gpu-mode/lectures/tree/main/lecture_001)
- [OLCF CUDA Training Series exercises](https://github.com/olcf/cuda-training-series/tree/master/exercises)
- [Programming Massively Parallel Processors](https://shop.elsevier.com/books/programming-massively-parallel-processors/hwu/978-0-443-43900-1), by Hwu, Kirk, and Hajj. We are working through this book; use its chapter topics to locate relevant reference materials and include the source links in learner notes or exercises.

## GPU infrastructure (NGC / brev)

For requests to run GPU code or start, stop, create, connect to, or otherwise
manage GPU infrastructure, first follow [`infra/brev/AGENTS.md`](infra/brev/AGENTS.md).
