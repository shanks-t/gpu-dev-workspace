"""Minimal RunPod REST API client; network operations are opt-in."""

from __future__ import annotations

import json
import os
import subprocess
import urllib.error
import urllib.request
from typing import Any

BASE_URL = "https://rest.runpod.io/v1"


class ApiError(RuntimeError):
    pass


def api_key() -> str:
    if value := os.environ.get("RUNPOD_API_KEY"):
        return value
    result = subprocess.run(
        ["security", "find-generic-password", "-a", os.environ.get("USER", ""),
         "-s", "runpod-gpu-workspace", "-w"],
        check=False, capture_output=True, text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    raise ApiError("RunPod key unavailable; add runpod-gpu-workspace to macOS Keychain")


def request(method: str, path: str, body: dict[str, Any] | None = None) -> Any:
    encoded = json.dumps(body).encode() if body is not None else None
    request_obj = urllib.request.Request(
        f"{BASE_URL}{path}", data=encoded, method=method,
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=30) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise ApiError(f"RunPod {method} {path} failed ({error.code}): {detail}") from error
