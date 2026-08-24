"""Static-analysis shim for the Triton language namespace."""

from typing import Any


class constexpr: ...


def arange(start: Any, end: Any) -> Any: ...


def load(*args: Any, **kwargs: Any) -> Any: ...


def program_id(axis: int) -> Any: ...


def store(*args: Any, **kwargs: Any) -> None: ...
