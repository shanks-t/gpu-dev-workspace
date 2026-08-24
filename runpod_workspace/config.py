"""Declarative RunPod workspace configuration and request rendering."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any


class ConfigError(ValueError):
    """Raised when a workspace configuration is unsafe or incomplete."""


REQUIRED = {"name", "cloud_type", "gpu_type_ids", "gpu_count", "storage"}


def load(path: str | Path, overrides: list[str] = ()) -> dict[str, Any]:
    try:
        config = json.loads(Path(path).read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise ConfigError(f"Cannot read configuration {path}: {error}") from error
    for item in overrides:
        set_override(config, item)
    validate(config)
    return config


def set_override(config: dict[str, Any], assignment: str) -> None:
    """Apply `a.b=value`, decoding a JSON value when possible."""
    if "=" not in assignment or assignment.startswith("="):
        raise ConfigError(f"Override must be path=value: {assignment!r}")
    path, raw_value = assignment.split("=", 1)
    value: Any
    try:
        value = json.loads(raw_value)
    except json.JSONDecodeError:
        value = raw_value
    target = config
    parts = path.split(".")
    for part in parts[:-1]:
        if not isinstance(target.get(part), dict):
            raise ConfigError(f"Override path does not exist: {path!r}")
        target = target[part]
    if parts[-1] not in target:
        raise ConfigError(f"Override path does not exist: {path!r}")
    target[parts[-1]] = value


def validate(config: dict[str, Any]) -> None:
    missing = REQUIRED - config.keys()
    if missing:
        raise ConfigError(f"Missing required fields: {', '.join(sorted(missing))}")
    if config["cloud_type"] not in {"COMMUNITY", "SECURE"}:
        raise ConfigError("cloud_type must be COMMUNITY or SECURE")
    if not isinstance(config["gpu_count"], int) or config["gpu_count"] < 1:
        raise ConfigError("gpu_count must be a positive integer")
    if not isinstance(config["gpu_type_ids"], list) or not config["gpu_type_ids"]:
        raise ConfigError("gpu_type_ids must be a non-empty list")
    image = config.get("image")
    template_id = config.get("template_id")
    if bool(image) == bool(template_id):
        raise ConfigError("configure exactly one of image or template_id")
    if image is not None and (not isinstance(image, str) or "@sha256:" not in image):
        raise ConfigError("image must be an immutable OCI reference containing @sha256:")
    if template_id is not None and not isinstance(template_id, str):
        raise ConfigError("template_id must be a string")
    storage = config["storage"]
    if not isinstance(storage, dict) or storage.get("mode") not in {"DISPOSABLE", "NETWORK_VOLUME"}:
        raise ConfigError("storage.mode must be DISPOSABLE or NETWORK_VOLUME")
    if storage["mode"] == "DISPOSABLE":
        if config["cloud_type"] != "COMMUNITY":
            raise ConfigError("DISPOSABLE storage is reserved for COMMUNITY configurations")
        if not isinstance(storage.get("volume_gb"), int) or storage["volume_gb"] < 0:
            raise ConfigError("DISPOSABLE storage requires non-negative volume_gb")
    else:
        if config["cloud_type"] != "SECURE":
            raise ConfigError("NETWORK_VOLUME storage requires SECURE cloud_type")
        if not isinstance(storage.get("network_volume_id"), str) or not storage["network_volume_id"]:
            raise ConfigError("NETWORK_VOLUME storage requires network_volume_id")
    if config.get("public_ssh", True) is not True:
        raise ConfigError("public_ssh must be true; proxy SSH is not supported")


def create_payload(config: dict[str, Any]) -> dict[str, Any]:
    """Render the documented POST /v1/pods payload without making a request."""
    validate(config)
    storage = copy.deepcopy(config["storage"])
    payload: dict[str, Any] = {
        "name": config["name"],
        "cloudType": config["cloud_type"],
        "computeType": "GPU",
        "gpuTypeIds": config["gpu_type_ids"],
        "gpuCount": config["gpu_count"],
        "gpuTypePriority": config.get("gpu_type_priority", "availability"),
        "containerDiskInGb": config.get("container_disk_gb", 20),
        "ports": ["22/tcp"],
        "supportPublicIp": True,
        "volumeMountPath": "/workspace",
        "interruptible": config.get("interruptible", False),
    }
    if "image" in config:
        payload["imageName"] = config["image"]
    else:
        payload["templateId"] = config["template_id"]
    if config.get("data_center_ids"):
        payload["dataCenterIds"] = config["data_center_ids"]
        payload["dataCenterPriority"] = config.get("data_center_priority", "availability")
    if storage["mode"] == "DISPOSABLE":
        payload["volumeInGb"] = storage["volume_gb"]
    else:
        payload["networkVolumeId"] = storage["network_volume_id"]
    return payload
