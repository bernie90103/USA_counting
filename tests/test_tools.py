import importlib.util
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ToolsTest(unittest.TestCase):
    def test_private_package_allowlist(self):
        subprocess.run(["python3", "tools/package_private.py"], cwd=ROOT, check=True, capture_output=True)
        spec = importlib.util.spec_from_file_location("package_private", ROOT / "tools/package_private.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        expected = set(module.FILES)
        for name in ("dist", "ios-app/www"):
            files = {str(p.relative_to(ROOT / name)) for p in (ROOT / name).rglob("*") if p.is_file()}
            self.assertEqual(files, expected)
            self.assertNotIn("data/transactions.js", files)
        source = (ROOT / "dist/app.js").read_text(encoding="utf-8")
        self.assertNotIn("sampleTransactions", source)
        self.assertNotIn("loadPublicTransactions", source)
        self.assertNotIn("護照更新", source)
