"""Direct SSH endpoint handling and local-first source synchronization."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .api import ApiError


def endpoint(pod: dict[str, Any]) -> tuple[str, int]:
    host = pod.get("publicIp")
    mappings = pod.get("portMappings") or {}
    port = mappings.get("22") or mappings.get(22)
    if not isinstance(host, str) or not host or not isinstance(port, int):
        raise ApiError(
            "Pod has no direct public SSH endpoint. Check Console logs/status; "
            "do not use the basic SSH proxy for synchronization or editor access."
        )
    return host, port


def rsync_command(pod: dict[str, Any], source: Path, remote_path: str,
                  identity_file: Path) -> list[str]:
    host, port = endpoint(pod)
    return [
        "rsync", "-az", "--delete", "--exclude", ".git", "--exclude", "__pycache__",
        "-e", f"ssh -i {identity_file} -p {port} -o StrictHostKeyChecking=accept-new",
        f"{source.resolve()}/", f"root@{host}:{remote_path.rstrip('/')}/",
    ]
