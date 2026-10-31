"""Unabhaengige Negativtests fuer das Laufzeitmedien-Inventar."""
import hashlib
import tempfile
import unittest
import json
import subprocess
import sys
from unittest.mock import patch
from pathlib import Path
from audit_runtime_assets import GAME, audit


class RuntimeAssetAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.file = GAME + 'assets/test.png'
        target = self.root / self.file
        target.parent.mkdir(parents=True)
        target.write_bytes(b'test-image-fixture')
        self.proof = 'docs/asset-rights-test.txt'
        (self.root / 'docs').mkdir()
        (self.root / self.proof).write_text('Nur Testdatei.', encoding='utf-8')
        self.entry = {'path': self.file, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                      'rights': 'own-work', 'rights_evidence': self.proof}
        self.tracked = [self.file, self.proof]

    def test_empty_inventory_is_valid_but_not_legal_clearance(self):
        self.assertEqual(audit(self.root, [], {'schema_version': 1, 'assets': []}), ([], 0))

    def test_complete_entry_matches_bytes_and_document(self):
        self.assertEqual(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [self.entry]}), ([], 1))

    def test_unlisted_media_is_blocked(self):
        errors, count = audit(self.root, self.tracked, {'schema_version': 1, 'assets': []})
        self.assertEqual(count, 1)
        self.assertIn('Nicht dokumentiertes', ' '.join(errors))

    def test_wrong_hash_is_blocked(self):
        bad = {**self.entry, 'sha256': '0' * 64}
        self.assertIn('Falscher SHA-256', ' '.join(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_missing_rights_evidence_is_blocked(self):
        bad = {**self.entry, 'rights_evidence': 'docs/absent.txt'}
        self.assertIn('Rechtenachweis nicht vorhanden', ' '.join(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_unknown_rights_are_blocked(self):
        bad = {**self.entry, 'rights': 'unknown'}
        self.assertIn('Keine dokumentierte Nutzungsgrundlage', ' '.join(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_path_traversal_is_blocked(self):
        bad = {**self.entry, 'path': GAME + '../secret.png'}
        self.assertIn('unzulaessiger Medienpfad', ' '.join(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_extra_manifest_entry_is_blocked(self):
        self.assertIn('ohne versionierte Laufzeitdatei', ' '.join(audit(self.root, [], {'schema_version': 1, 'assets': [self.entry]})[0]))

    def test_duplicate_entry_is_blocked(self):
        self.assertIn('Doppelter Medienpfad', ' '.join(audit(self.root, self.tracked, {'schema_version': 1, 'assets': [self.entry, self.entry]})[0]))

    def test_bad_schema_is_blocked(self):
        self.assertIn('Ungueltiges Manifest', ' '.join(audit(self.root, [], {'schema_version': 2, 'assets': []})[0]))


    def test_untracked_proof_is_blocked(self):
        self.assertIn('Rechtenachweis nicht versioniert', ' '.join(
            audit(self.root, [self.file], {'schema_version': 1, 'assets': [self.entry]})[0]))

    def test_empty_proof_is_blocked(self):
        (self.root / self.proof).write_bytes(b'')
        self.assertIn('Rechtenachweis leer', ' '.join(
            audit(self.root, self.tracked, {'schema_version': 1, 'assets': [self.entry]})[0]))

    def test_placeholder_rights_are_blocked(self):
        for value in ('test-only', 'pending', 'unknown', 'todo', 'unlicensed', 'own-work TBD'):
            with self.subTest(rights=value):
                bad = {**self.entry, 'rights': value}
                self.assertIn('Keine dokumentierte Nutzungsgrundlage', ' '.join(
                    audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_control_characters_in_proof_path_are_blocked(self):
        bad = {**self.entry, 'rights_evidence': 'docs/proof\n.txt'}
        self.assertIn('Fehlender sicherer Rechtenachweis', ' '.join(
            audit(self.root, self.tracked, {'schema_version': 1, 'assets': [bad]})[0]))

    def test_new_media_extensions_are_audited(self):
        for suffix in ('.avif', '.m4a', '.pdf', '.glb'):
            with self.subTest(suffix=suffix):
                asset = GAME + 'assets/test' + suffix
                errors, count = audit(self.root, [asset], {'schema_version': 1, 'assets': []})
                self.assertEqual(count, 1)
                self.assertIn('Nicht dokumentiertes', ' '.join(errors))

    def test_symlinked_proof_is_blocked(self):
        link = self.root / 'docs/link.txt'
        link.symlink_to(self.root / self.proof)
        bad = {**self.entry, 'rights_evidence': 'docs/link.txt'}
        self.assertIn('Rechtenachweis nicht vorhanden', ' '.join(
            audit(self.root, self.tracked + ['docs/link.txt'], {'schema_version': 1, 'assets': [bad]})[0]))



    def test_large_media_hash_is_streamed_without_read_bytes(self):
        target = self.root / self.file
        target.write_bytes(b'large-media-fixture-' * 70000)
        entry = {**self.entry, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        with patch.object(Path, 'read_bytes', side_effect=AssertionError('unbounded read')):
            self.assertEqual(audit(self.root, self.tracked,
                                   {'schema_version': 1, 'assets': [entry]}), ([], 1))

    def test_media_read_error_is_reported_without_crashing(self):
        target = self.root / self.file
        original_open = Path.open

        def fail_asset_open(path, *args, **kwargs):
            if path == target:
                raise PermissionError('simulated denied read')
            return original_open(path, *args, **kwargs)

        with patch.object(Path, 'open', fail_asset_open):
            errors, count = audit(self.root, self.tracked,
                                  {'schema_version': 1, 'assets': [self.entry]})
        self.assertEqual(count, 1)
        self.assertIn('Laufzeitmedium nicht lesbar', ' '.join(errors))

    def test_symlinked_media_is_rejected_even_inside_repository(self):
        target = self.root / self.file
        target.unlink()
        target.symlink_to(self.root / self.proof)
        errors, count = audit(self.root, self.tracked,
                              {'schema_version': 1, 'assets': [self.entry]})
        self.assertEqual(count, 1)
        self.assertIn('Unzulaessige Laufzeitdatei', ' '.join(errors))

    def test_malformed_manifest_returns_clean_failure_from_cli(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / 'project-c/pppoppi-imperium/prerelease'
            directory.mkdir(parents=True)
            script = directory / 'audit_runtime_assets.py'
            script.write_text(Path(__file__).with_name('audit_runtime_assets.py').read_text(
                encoding='utf-8'), encoding='utf-8')
            manifest = directory / 'runtime_asset_manifest.json'
            manifest.write_text('{}', encoding='utf-8')
            subprocess.run(['git', 'init', '-q'], cwd=root, check=True, capture_output=True)
            subprocess.run(['git', 'add', '.'], cwd=root, check=True, capture_output=True)
            for invalid in ({}, {'schema_version': 1, 'assets': None},
                            {'schema_version': 1, 'assets': {}}):
                with self.subTest(invalid=invalid):
                    manifest.write_text(json.dumps(invalid), encoding='utf-8')
                    result = subprocess.run([sys.executable, str(script)], cwd=root,
                                            capture_output=True, text=True, timeout=10)
                    self.assertEqual(result.returncode, 1, result.stderr)
                    self.assertIn('Ungueltiges Manifest', result.stderr)
                    self.assertNotIn('Traceback', result.stderr)


if __name__ == '__main__':
    unittest.main()
