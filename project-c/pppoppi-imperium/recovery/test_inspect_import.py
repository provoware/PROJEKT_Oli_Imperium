"""Lesende Teilimport-Diagnose mit ausschliesslich kuenstlichen Quelldaten."""
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch
import zipfile

from import_archive import ZIP_PREFIX, prepare_import
from inspect_import import inspect_destination, main
from verify_sources import inventory_digest


class InspectImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.destination = self.root / 'imported'
        self.zip_path = self.root / 'fixture.zip'
        self.files = {
            'SPIEL/index.html': b'<html>synthetisch</html>',
            'SPIEL/src/neo_bridge.js': b'const a = 1;',
            'SPIEL/src/strategy_logistics_v193.js': b'const b = 2;',
        }
        entries = [
            {'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data)}
            for name, data in self.files.items()
        ]
        self.meta = {
            'source_sha256': 'a' * 64, 'source_entries': 4,
            'total_files': 3, 'files': entries,
        }
        self.verification = {
            'expected_inventory_sha256': inventory_digest(entries),
            'expected_count': 3, 'expected_source_sha256': 'a' * 64,
            'expected_archive_entries': 4,
        }

    def inspect(self):
        return inspect_destination(self.destination, verification=self.verification)

    def import_valid(self):
        with zipfile.ZipFile(self.zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, data in self.files.items():
                archive.writestr(ZIP_PREFIX + name, data)
            archive.writestr(ZIP_PREFIX + 'WIEDERHERSTELLUNG_MANIFEST.json',
                             json.dumps(self.meta))
            archive.writestr(ZIP_PREFIX + 'QUELLIMPORT_HINWEIS.md', 'synthetisch')
        digest = hashlib.sha256(self.zip_path.read_bytes()).hexdigest()
        return prepare_import(self.zip_path, self.destination,
                              expected_archive_sha256=digest,
                              verification=self.verification)

    def test_missing_destination_is_not_created(self):
        self.assertEqual(self.inspect()[0], 'MISSING')
        self.assertFalse(self.destination.exists())

    def test_symlink_destination_is_unsafe_and_target_unchanged(self):
        victim = self.root / 'victim'
        victim.mkdir()
        marker = victim / 'private.txt'
        marker.write_text('nicht anfassen')
        self.destination.symlink_to(victim, target_is_directory=True)
        self.assertEqual(self.inspect()[0], 'UNSAFE')
        self.assertEqual(marker.read_text(), 'nicht anfassen')

    def test_regular_file_is_unsafe(self):
        self.destination.write_text('fremde Daten')
        self.assertEqual(self.inspect()[0], 'UNSAFE')
        self.assertEqual(self.destination.read_text(), 'fremde Daten')

    def test_empty_destination_is_incomplete_and_preserved(self):
        self.destination.mkdir()
        self.assertEqual(self.inspect()[0], 'INCOMPLETE')
        self.assertTrue(self.destination.is_dir())

    def test_partial_install_without_manifest_is_incomplete(self):
        (self.destination / 'SPIEL').mkdir(parents=True)
        marker = self.destination / 'SPIEL' / 'index.html'
        marker.write_bytes(b'fragment')
        self.assertEqual(self.inspect()[0], 'INCOMPLETE')
        self.assertEqual(marker.read_bytes(), b'fragment')

    def test_foreign_root_file_is_not_removed(self):
        self.import_valid()
        marker = self.destination / 'user.txt'
        marker.write_text('mein Text')
        self.assertEqual(self.inspect()[0], 'FOREIGN')
        self.assertEqual(marker.read_text(), 'mein Text')

    def test_spiel_symlink_is_unsafe(self):
        self.destination.mkdir()
        victim = self.root / 'victim'
        victim.mkdir()
        (self.destination / 'SPIEL').symlink_to(victim, target_is_directory=True)
        self.assertEqual(self.inspect()[0], 'UNSAFE')

    def test_manifest_symlink_is_unsafe(self):
        self.destination.mkdir()
        (self.destination / 'SPIEL').mkdir()
        victim = self.root / 'victim.json'
        victim.write_text('geheim')
        (self.destination / 'WIEDERHERSTELLUNG_MANIFEST.json').symlink_to(victim)
        self.assertEqual(self.inspect()[0], 'UNSAFE')
        self.assertEqual(victim.read_text(), 'geheim')

    def test_malformed_manifest_is_invalid(self):
        self.destination.mkdir()
        (self.destination / 'SPIEL').mkdir()
        (self.destination / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text('{')
        self.assertEqual(self.inspect()[0], 'INVALID')

    def test_complete_synthetic_import_is_checked(self):
        self.assertEqual(self.import_valid(), 3)
        status, detail = self.inspect()
        self.assertEqual(status, 'CHECKED')
        self.assertIn('3 Quellen', detail)

    def test_missing_source_after_complete_import_is_incomplete(self):
        self.import_valid()
        (self.destination / 'SPIEL' / 'index.html').unlink()
        self.assertEqual(self.inspect()[0], 'INCOMPLETE')

    def test_changed_source_after_complete_import_is_invalid(self):
        self.import_valid()
        (self.destination / 'SPIEL' / 'index.html').write_bytes(b'faelschung')
        self.assertEqual(self.inspect()[0], 'INVALID')

    def test_symlink_inside_spiel_is_invalid(self):
        self.import_valid()
        target = self.destination / 'SPIEL' / 'index.html'
        target.unlink()
        target.symlink_to(self.root / 'nicht_vorhanden')
        self.assertEqual(self.inspect()[0], 'INVALID')

    def test_target_replacement_during_validation_is_unsafe(self):
        self.import_valid()
        displaced = self.root / 'displaced'
        victim = self.root / 'victim'
        victim.mkdir()
        (victim / 'keep.txt').write_text('erhalten')

        def replace(*args, **kwargs):
            os.rename(self.destination, displaced)
            self.destination.symlink_to(victim, target_is_directory=True)
            return 3

        with patch('inspect_import.validate_sources', side_effect=replace):
            self.assertEqual(self.inspect()[0], 'UNSAFE')
        self.assertEqual((victim / 'keep.txt').read_text(), 'erhalten')
        self.assertTrue((displaced / 'SPIEL' / 'index.html').exists())

    def test_cli_missing_returns_nonzero(self):
        with redirect_stdout(io.StringIO()) as output:
            self.assertEqual(main(['--destination', str(self.destination)]), 1)
        self.assertIn('MISSING:', output.getvalue())


if __name__ == '__main__':
    unittest.main()
