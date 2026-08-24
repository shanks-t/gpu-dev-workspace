import unittest

from runpod_workspace.config import ConfigError, create_payload, validate
from runpod_workspace.api import ApiError
from runpod_workspace.ssh import endpoint, rsync_command
from pathlib import Path


BASE = {
    "name": "test", "cloud_type": "COMMUNITY", "gpu_type_ids": ["NVIDIA RTX A4000"],
    "gpu_count": 1, "image": "example/image@sha256:" + "a" * 64,
    "storage": {"mode": "DISPOSABLE", "volume_gb": 20}, "public_ssh": True,
}


class ConfigTests(unittest.TestCase):
    def test_community_payload_requests_public_ssh(self):
        payload = create_payload(BASE)
        self.assertEqual(payload["ports"], ["22/tcp"])
        self.assertTrue(payload["supportPublicIp"])
        self.assertEqual(payload["volumeInGb"], 20)

    def test_network_volume_requires_secure_cloud(self):
        config = {**BASE, "storage": {"mode": "NETWORK_VOLUME", "network_volume_id": "vol"}}
        with self.assertRaises(ConfigError):
            validate(config)

    def test_image_must_be_immutable(self):
        config = {**BASE, "image": "runpod/pytorch:latest"}
        with self.assertRaises(ConfigError):
            validate(config)

    def test_template_is_an_alternative_to_project_image(self):
        config = {key: value for key, value in BASE.items() if key != "image"}
        config["template_id"] = "runpod-torch-v280"
        self.assertEqual(create_payload(config)["templateId"], "runpod-torch-v280")

    def test_sync_uses_direct_mapped_ssh(self):
        pod = {"publicIp": "198.51.100.2", "portMappings": {"22": 10222}}
        command = rsync_command(pod, Path("."), "/workspace/repo", Path("/tmp/key"))
        self.assertIn("-p 10222", command[8])
        self.assertEqual(command[-1], "root@198.51.100.2:/workspace/repo/")

    def test_sync_rejects_proxy_only_pod(self):
        with self.assertRaises(ApiError):
            endpoint({"publicIp": "", "portMappings": {}})
