import unittest
from unittest.mock import MagicMock, patch

from runpod_workspace.config import ConfigError, create_payload, network_volume_payload, validate
from runpod_workspace.api import ApiError, status_summary
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

    def test_private_image_includes_registry_authentication(self):
        config = {**BASE, "registry_auth_id": "registry-123"}
        self.assertEqual(create_payload(config)["containerRegistryAuthId"], "registry-123")

    def test_sync_uses_direct_mapped_ssh(self):
        pod = {"publicIp": "198.51.100.2", "portMappings": {"22": 10222}}
        command = rsync_command(pod, Path("."), "/workspace/repo", Path("/tmp/key"))
        self.assertIn("-p 10222", command[8])
        self.assertEqual(command[-1], "root@198.51.100.2:/workspace/repo/")

    def test_sync_rejects_proxy_only_pod(self):
        with self.assertRaises(ApiError):
            endpoint({"publicIp": "", "portMappings": {}})

    def test_network_volume_payload(self):
        payload = network_volume_payload({"name": "workspace", "size_gb": 50, "data_center_id": "US-KS-2"})
        self.assertEqual(payload, {"name": "workspace", "size": 50, "dataCenterId": "US-KS-2"})

    def test_status_discloses_retained_network_volume(self):
        summary = status_summary({"id": "pod", "networkVolume": {"id": "volume", "size": 50}})
        self.assertIn("continues storage billing", summary["storage_notice"])

    @patch("runpod_workspace.api.api_key", return_value="test-key")
    @patch("runpod_workspace.api.urllib.request.urlopen")
    def test_empty_delete_response_is_successful(self, urlopen, _api_key):
        response = MagicMock()
        response.read.return_value = b""
        urlopen.return_value.__enter__.return_value = response
        from runpod_workspace.api import request
        self.assertIsNone(request("DELETE", "/pods/example"))
