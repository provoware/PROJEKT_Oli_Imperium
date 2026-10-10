import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from check_agent_policy import EXPECTED, check

class TestAgentContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        folder = self.root / ".codex" / "agents"
        folder.mkdir(parents=True)
        (self.root / ".codex" / "config.toml").write_text("[agents]\nenabled = true\nmax_concurrent_threads_per_session = 3\n")
        (self.root / "AGENTS.md").write_text("Nur operator schreibt.")
        for name, mode in EXPECTED.items():
            (folder / f"{name}.toml").write_text(f'name = "{name}"\ndescription = "Rolle"\nsandbox_mode = "{mode}"\ndeveloper_instructions = "Machen."\n')

    def tearDown(self):
        self.tmp.cleanup()

    def test_valid_configuration(self):
        self.assertEqual(check(self.root), [])

    def test_two_writers_rejected(self):
        path = self.root / ".codex" / "agents" / "pruefer.toml"
        path.write_text(path.read_text().replace('read-only', 'workspace-write'))
        self.assertTrue(any("pruefer" in x and "sandbox_mode" in x for x in check(self.root)))

    def test_missing_role_rejected(self):
        (self.root / ".codex" / "agents" / "planer.toml").unlink()
        self.assertTrue(any("Rollenmenge" in x for x in check(self.root)))

    def test_bad_parallel_limit(self):
        path = self.root / ".codex" / "config.toml"
        path.write_text("[agents]\nmax_concurrent_threads_per_session = 20\n")
        self.assertTrue(any("Agentenlimit" in x for x in check(self.root)))

    def test_missing_instruction_rejected(self):
        path = self.root / ".codex" / "agents" / "forscher.toml"
        path.write_text(path.read_text().replace('developer_instructions = "Machen."', 'developer_instructions = ""'))
        self.assertTrue(any("developer_instructions" in x for x in check(self.root)))

    def test_renamed_role_rejected(self):
        path = self.root / ".codex" / "agents" / "operator.toml"
        path.write_text(path.read_text().replace('name = "operator"', 'name = "worker"'))
        self.assertTrue(any("Dateiname" in x for x in check(self.root)))

if __name__ == "__main__":
    unittest.main()
