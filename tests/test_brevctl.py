import importlib.machinery
import importlib.util
from pathlib import Path
import unittest


SCRIPT = Path(__file__).parents[1] / "infra/brev/scripts/brevctl"
loader = importlib.machinery.SourceFileLoader("brevctl", str(SCRIPT))
spec = importlib.util.spec_from_loader(loader.name, loader)
brevctl = importlib.util.module_from_spec(spec)
loader.exec_module(brevctl)


class ProfileTests(unittest.TestCase):
    def test_fundamentals_renders_price_sorted_json_search(self):
        profile = brevctl.load_profile("fundamentals", [])
        command = brevctl.rendered(profile)["search"]
        self.assertEqual(command[:3], ["brev", "search", "--json"])
        self.assertIn("--stoppable", command)
        self.assertIn("--sort", command)

    def test_profiling_requires_48gb_and_ada_or_newer(self):
        profile = brevctl.load_profile("profiling", [])
        self.assertEqual(profile["min_vram_gb"], 48)
        self.assertEqual(profile["min_compute_capability"], "8.9")

    def test_invalid_profile_override_is_rejected(self):
        with self.assertRaises(ValueError):
            brevctl.load_profile("fundamentals", ["not_a_field=1"])

    def test_create_is_always_dry_run_in_rendered_plan(self):
        profile = brevctl.load_profile("fundamentals", [])
        self.assertIn("--dry-run", brevctl.rendered(profile)["create_dry_run"])

    def test_profile_render_keeps_the_price_gate_local_and_visible(self):
        profile = brevctl.load_profile("fundamentals", [])
        self.assertEqual(profile["max_hourly_price_usd"], 1.50)
        self.assertEqual(profile["runtime_deadline_minutes"], 120)
