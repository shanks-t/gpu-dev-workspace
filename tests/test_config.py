import unittest

from runpod_workspace.config import ConfigError, create_payload, validate


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
