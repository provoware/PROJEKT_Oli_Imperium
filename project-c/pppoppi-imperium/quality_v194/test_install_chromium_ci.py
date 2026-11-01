#!/usr/bin/env python3
"""Fail-closed Regression der Chromium-CI-Installation, ohne Netz oder apt.

Ein simuliertes `timeout` protokolliert die tatsaechlichen Shell-Aufrufe.
Die reale Chromium-Startprobe bleibt im GitHub-Browserjob verpflichtend.
"""
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("install_chromium_ci.sh")
TIMEOUT_STUB = r'''#!/usr/bin/env python3
import json
import os
import sys

args = sys.argv[1:]
if "pip" in args:
    stage = "pip"
elif "--with-deps" in args:
    stage = "deps"
elif "install" in args and "chromium" in args:
    stage = "fallback"
elif args[-2:] == ["python", "-"]:
    stage = "launch"
else:
    sys.exit(70)
source = sys.stdin.read() if stage == "launch" else ""
with open(os.environ["INSTALL_TEST_LOG"], "a", encoding="utf-8") as handle:
    handle.write(json.dumps({"stage": stage, "args": args,
                             "launch_source": source}, ensure_ascii=False) + "\n")
failures = os.environ.get("INSTALL_TEST_FAIL", "").split(",")
if stage in failures:
    sys.exit(23)
if stage == "launch" and not all(
        token in source for token in ("sync_playwright", "chromium.launch", "browser.close")):
    sys.exit(71)
'''


class ChromiumInstallerTests(unittest.TestCase):
    def run_scenario(self, failed_stages, expected_stages, expected_code):
        with tempfile.TemporaryDirectory(prefix="chromium-installer-test-") as folder:
            root = Path(folder)
            stub = root / "timeout"
            stub.write_text(TIMEOUT_STUB, encoding="utf-8")
            stub.chmod(0o755)
            log = root / "calls.jsonl"
            env = dict(os.environ)
            env.update({
                "PATH": str(root) + os.pathsep + os.environ.get("PATH", ""),
                "INSTALL_TEST_LOG": str(log),
                "INSTALL_TEST_FAIL": ",".join(failed_stages),
            })
            result = subprocess.run(
                ["bash", str(SCRIPT)], env=env, text=True,
                capture_output=True, timeout=20, check=False,
            )
            self.assertEqual(result.returncode, expected_code, result.stdout + result.stderr)
            calls = [json.loads(line) for line in log.read_text(encoding="utf-8").splitlines()]
            self.assertEqual([call["stage"] for call in calls], expected_stages)
            expected_limits = {"pip": "120s", "deps": "180s",
                               "fallback": "180s", "launch": "60s"}
            for call in calls:
                args = call["args"]
                self.assertEqual(args[:3], ["--signal=TERM", "--kill-after=10s",
                                             expected_limits[call["stage"]]])
                self.assertEqual(args[3], "python")
            if "launch" in expected_stages:
                self.assertIn("chromium.launch(headless=True)", calls[-1]["launch_source"])
            return result

    def test_normal_install_requires_browser_launch(self):
        self.run_scenario([], ["pip", "deps", "launch"], 0)

    def test_apt_failure_requires_fallback_and_launch(self):
        result = self.run_scenario(["deps"], ["pip", "deps", "fallback", "launch"], 0)
        self.assertIn("::warning::", result.stdout)

    def test_pip_failure_stops_before_browser(self):
        self.run_scenario(["pip"], ["pip"], 23)

    def test_both_install_paths_failing_stops_before_launch(self):
        self.run_scenario(["deps", "fallback"], ["pip", "deps", "fallback"], 23)

    def test_failed_browser_launch_is_not_suppressed(self):
        self.run_scenario(["launch"], ["pip", "deps", "launch"], 23)


if __name__ == "__main__":
    unittest.main(verbosity=2)
