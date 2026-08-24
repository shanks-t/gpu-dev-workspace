"""Static-analysis shim for the Linux-only Triton runtime."""

from typing import Any


def jit(function: Any) -> Any: ...


def next_power_of_2(value: Any) -> int: ...


class testing:
    class Benchmark:
        def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    @staticmethod
    def do_bench(*args: Any, **kwargs: Any) -> Any: ...

    @staticmethod
    def perf_report(*args: Any, **kwargs: Any) -> Any: ...
