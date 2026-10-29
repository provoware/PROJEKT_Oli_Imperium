"""Unabhaengige Negativtests fuer das Laufzeitmedien-Inventar."""
import hashlib
import tempfile
import unittest
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
                      'rights': 'test-only', 'rights_evidence': self.proof}

    def test_empty_inventory_is_valid_but_not_legal_clearance(self):
        self.assertEqual(audit(self.root, [], {'schema_version': 1, 'assets': []}), ([], 0))

    def test_complete_entry_matches_bytes_and_document(self):
        self.assertEqual(audit(self.root, [self.file], {'schema_version': 1, 'assets': [self.entry]}), ([], 1))

    def test_unlisted_media_is_blocked(self):
        errors, count = audit(self.root, [self.file], {'schema_version': 1, 'assets': []})
        self.assertEqual(count, 1)
        self.assertIn('Nicht dokumentiertes', ' '.join(errors))

    def test_wrong_hash_is_blocked(self):
        bad = {**self.entry, 'sha256': '0' * 64}
        self.assertIn('Falscher SHA-256', ' '.join(audit(self.root, [self.file], {'schema_version': 1, 'assets': [bad]})[0]))

    def test_missing_rights_evidence_is_blocked(self):
        bad = {**self.entry, 'rights_evidence': 'docs/absent.txt'}
        self.assertIn('Rechtenachweis nicht vorhanden', ' '.join(audit(self.root, [self.file], {'schema_version': 1, 'assets': [bad]})[0]))

    def test_unknown_rights_are_blocked(self):
        bad = {**self.entry, 'rights': 'unknown'}
        self.assertIn('Keine dokumentierte Nutzungsgrundlage', ' '.join(audit(self.root, [self.file], {'schema_version': 1, 'assets': [bad]})[0]))

    def test_path_traversal_is_blocked(self):
        bad = {**self.entry, 'path': GAME + '../secret.png'}
        self.assertIn('unzulaessiger Medienpfad', ' '.join(audit(self.root, [self.file], {'schema_version': 1, 'assets': [bad]})[0]))

    def test_extra_manifest_entry_is_blocked(self):
        self.assertIn('ohne versionierte Laufzeitdatei', ' '.join(audit(self.root, [], {'schema_version': 1, 'assets': [self.entry]})[0]))

    def test_duplicate_entry_is_blocked(self):
        self.assertIn('Doppelter Medienpfad', ' '.join(audit(self.root, [self.file], {'schema_version': 1, 'assets': [self.entry, self.entry]})[0]))

    def test_bad_schema_is_blocked(self):
        self.assertIn('Ungueltiges Manifest', ' '.join(audit(self.root, [], {'schema_version': 2, 'assets': []})[0]))


if __name__ == '__main__':
    unittest.main()
