"""Isolierte Importtests mit KUENSTLICHEN Quellen; kein Originalspiel enthalten."""
import hashlib
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

from import_archive import (ImportRejected, MAX_MEMBER_BYTES, ZIP_PREFIX,
                            _sha256, prepare_import)
from verify_sources import inventory_digest, validate_sources


class OfflineImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.zip_path = self.root / 'safe.zip'
        self.destination = self.root / 'imported'
        self.files = {
            'SPIEL/index.html': b'<html>test</html>',
            'SPIEL/src/neo_bridge.js': b'const a = 1;',
            'SPIEL/src/strategy_logistics_v193.js': b'const b = 2;',
        }
        self.entries = [
            {'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data)}
            for name, data in self.files.items()
        ]
        self.meta = {
            'source_sha256': 'a' * 64,
            'source_entries': 4,
            'total_files': 3,
            'files': self.entries,
        }
        self.verify_args = {
            'expected_inventory_sha256': inventory_digest(self.entries),
            'expected_count': 3,
            'expected_source_sha256': 'a' * 64,
            'expected_archive_entries': 4,
        }

    def build(self, *, files=None, meta=None, extras=None):
        with zipfile.ZipFile(self.zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, content in (self.files if files is None else files).items():
                archive.writestr(ZIP_PREFIX + name, content)
            archive.writestr(ZIP_PREFIX + 'WIEDERHERSTELLUNG_MANIFEST.json',
                             json.dumps(self.meta if meta is None else meta))
            archive.writestr(ZIP_PREFIX + 'QUELLIMPORT_HINWEIS.md', 'Testhinweis')
            for name, content in (extras or []):
                archive.writestr(name, content)
        return hashlib.sha256(self.zip_path.read_bytes()).hexdigest()

    def run_import(self, digest):
        return prepare_import(self.zip_path, self.destination,
                              expected_archive_sha256=digest,
                              verification=self.verify_args)

    def test_valid_archive_imports_exact_files_and_manifest(self):
        digest = self.build()
        self.assertEqual(self.run_import(digest), 3)
        self.assertEqual(validate_sources(self.destination, **self.verify_args), 3)
        self.assertEqual(
            sorted(p.relative_to(self.destination).as_posix()
                   for p in self.destination.rglob('*') if p.is_file()),
            sorted([*self.files, 'WIEDERHERSTELLUNG_MANIFEST.json']))
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))

    def test_original_zip_is_reduced_to_verified_text_sources(self):
        with zipfile.ZipFile(self.zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, content in self.files.items():
                archive.writestr(name, content)
            archive.writestr('SPIEL/cover.png', b'fake media not imported')
        digest = hashlib.sha256(self.zip_path.read_bytes()).hexdigest()
        self.assertEqual(
            prepare_import(self.zip_path, self.destination,
                           expected_original_sha256=digest,
                           verification=self.verify_args), 3)
        self.assertEqual(validate_sources(self.destination, **self.verify_args), 3)
        self.assertFalse((self.destination / 'SPIEL/cover.png').exists())
        manifest = json.loads(
            (self.destination / 'WIEDERHERSTELLUNG_MANIFEST.json').read_text())
        self.assertEqual(manifest['source_sha256'], 'a' * 64)
        self.assertEqual(manifest['source_entries'], 4)

    def test_original_zip_with_modified_source_rejected(self):
        with zipfile.ZipFile(self.zip_path, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, content in self.files.items():
                archive.writestr(name, content + b'changed')
            archive.writestr('SPIEL/cover.png', b'fake media')
        digest = hashlib.sha256(self.zip_path.read_bytes()).hexdigest()
        with self.assertRaises(ImportRejected):
            prepare_import(self.zip_path, self.destination,
                           expected_original_sha256=digest,
                           verification=self.verify_args)
        self.assertFalse(self.destination.exists())

    def test_wrong_archive_digest_never_creates_destination(self):
        self.build()
        with self.assertRaisesRegex(ImportRejected, 'SHA-256'):
            self.run_import('0' * 64)
        self.assertFalse(self.destination.exists())

    def test_traversal_in_archive_rejected_before_extraction(self):
        digest = self.build(extras=[(ZIP_PREFIX + 'SPIEL/../outside.js', 'bad')])
        with self.assertRaises(ImportRejected):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())
        self.assertFalse((self.root / 'outside.js').exists())

    def test_symlink_in_archive_rejected(self):
        info = zipfile.ZipInfo(ZIP_PREFIX + 'SPIEL/link.js')
        info.create_system = 3
        info.external_attr = (stat.S_IFLNK | 0o777) << 16
        digest = self.build(extras=[(info, 'src/neo_bridge.js')])
        with self.assertRaisesRegex(ImportRejected, 'Sonderdatei oder Link'):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_duplicate_zip_member_rejected(self):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            digest = self.build(extras=[
                (ZIP_PREFIX + 'SPIEL/index.html', b'double')])
        with self.assertRaisesRegex(ImportRejected, 'Doppelter ZIP-Eintrag'):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_existing_destination_is_never_overwritten(self):
        digest = self.build()
        self.destination.mkdir()
        marker = self.destination / 'user.txt'
        marker.write_text('unveraendert', encoding='utf-8')
        with self.assertRaisesRegex(ImportRejected, 'existiert bereits'):
            self.run_import(digest)
        self.assertEqual(marker.read_text(encoding='utf-8'), 'unveraendert')

    def test_wrong_source_bytes_block_import(self):
        changed = dict(self.files)
        changed['SPIEL/index.html'] = b'FAKE'
        digest = self.build(files=changed)
        with self.assertRaises(ImportRejected):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_extra_unlisted_source_blocks_import(self):
        changed = dict(self.files)
        changed['SPIEL/extra.js'] = b'const extra = 1;'
        digest = self.build(files=changed)
        with self.assertRaises(ImportRejected):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_unauthorized_zip_entry_rejected(self):
        digest = self.build(extras=[('private/secret.txt', 'not allowed')])
        with self.assertRaisesRegex(ImportRejected, 'Nicht freigegebener'):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_oversized_source_rejected_without_install(self):
        changed = dict(self.files)
        changed['SPIEL/index.html'] = b'X' * (MAX_MEMBER_BYTES + 1)
        digest = self.build(files=changed)
        with self.assertRaisesRegex(ImportRejected, 'zu gross'):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_broken_zip_rejected(self):
        self.zip_path.write_bytes(b'kein zip')
        digest = hashlib.sha256(self.zip_path.read_bytes()).hexdigest()
        with self.assertRaises(ImportRejected):
            self.run_import(digest)
        self.assertFalse(self.destination.exists())

    def test_install_failure_keeps_partial_target_without_deleting_data(self):
        digest = self.build()
        original_rename = os.rename
        calls = 0

        def fail_second_rename(src, dst, *args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError('simulierter Schreibfehler')
            return original_rename(src, dst, *args, **kwargs)

        with patch('import_archive.os.rename', side_effect=fail_second_rename):
            with self.assertRaises(ImportRejected):
                self.run_import(digest)
        self.assertTrue((self.destination / 'SPIEL/index.html').is_file())
        self.assertFalse((self.destination / 'WIEDERHERSTELLUNG_MANIFEST.json').exists())
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))

    def test_swapped_target_symlink_never_redirects_import_or_deletes_victim(self):
        digest = self.build()
        victim = self.root / 'victim'
        victim.mkdir()
        (victim / 'user.txt').write_text('geschuetzt', encoding='utf-8')
        displaced = self.root / 'displaced'
        original_rename = os.rename
        calls = 0

        def swap_after_first_rename(src, dst, *args, **kwargs):
            nonlocal calls
            calls += 1
            result = original_rename(src, dst, *args, **kwargs)
            if calls == 1:
                original_rename(self.destination, displaced)
                self.destination.symlink_to(victim, target_is_directory=True)
            return result

        with patch('import_archive.os.rename', side_effect=swap_after_first_rename):
            with self.assertRaisesRegex(ImportRejected, 'ausgetauscht'):
                self.run_import(digest)
        self.assertEqual((victim / 'user.txt').read_text(encoding='utf-8'),
                         'geschuetzt')
        self.assertEqual(sorted(p.name for p in victim.iterdir()), ['user.txt'])
        self.assertTrue(self.destination.is_symlink())
        self.assertTrue((displaced / 'SPIEL/index.html').is_file())
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))

    def test_swapped_target_on_write_failure_keeps_unrelated_directory(self):
        digest = self.build()
        victim = self.root / 'victim'
        victim.mkdir()
        marker = victim / 'keep.txt'
        marker.write_text('nicht loeschen', encoding='utf-8')
        displaced = self.root / 'displaced'
        original_rename = os.rename
        calls = 0

        def swap_then_fail(src, dst, *args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError('simulierter zweiter Schreibfehler')
            result = original_rename(src, dst, *args, **kwargs)
            if calls == 1:
                original_rename(self.destination, displaced)
                self.destination.symlink_to(victim, target_is_directory=True)
            return result

        with patch('import_archive.os.rename', side_effect=swap_then_fail):
            with self.assertRaises(ImportRejected):
                self.run_import(digest)
        self.assertEqual(marker.read_text(encoding='utf-8'), 'nicht loeschen')
        self.assertEqual(sorted(p.name for p in victim.iterdir()), ['keep.txt'])
        self.assertTrue(self.destination.is_symlink())
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))


    def test_bounded_archive_hash_accepts_exact_size(self):
        data = b'test-data' * 10000
        self.assertEqual(_sha256(io.BytesIO(data), len(data)),
                         hashlib.sha256(data).hexdigest())
        self.assertEqual(_sha256(io.BytesIO(b''), 0),
                         hashlib.sha256(b'').hexdigest())

    def test_bounded_archive_hash_rejects_growth(self):
        with self.assertRaisesRegex(ImportRejected, 'gewachsen'):
            _sha256(io.BytesIO(b'abcd'), 3)

    def test_bounded_archive_hash_rejects_truncation(self):
        with self.assertRaisesRegex(ImportRejected, 'verkuerzt'):
            _sha256(io.BytesIO(b'ab'), 3)

    def test_archive_growth_after_initial_hash_blocks_installation(self):
        digest = self.build()
        original_hash = _sha256
        calls = 0

        def append_after_hash(stream, expected_size):
            nonlocal calls
            result = original_hash(stream, expected_size)
            calls += 1
            if calls == 1:
                with self.zip_path.open('ab') as writer:
                    writer.write(b'parallel angehaengte Bytes')
            return result

        with patch('import_archive._sha256', side_effect=append_after_hash):
            with self.assertRaisesRegex(ImportRejected, 'Archivgroesse'):
                self.run_import(digest)
        self.assertFalse(self.destination.exists())
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))

    def test_archive_truncation_after_initial_hash_blocks_installation(self):
        digest = self.build()
        original_hash = _sha256
        calls = 0

        def truncate_after_hash(stream, expected_size):
            nonlocal calls
            result = original_hash(stream, expected_size)
            calls += 1
            if calls == 1:
                with self.zip_path.open('r+b') as writer:
                    writer.truncate(expected_size - 1)
            return result

        with patch('import_archive._sha256', side_effect=truncate_after_hash):
            with self.assertRaisesRegex(ImportRejected, 'Archivgroesse'):
                self.run_import(digest)
        self.assertFalse(self.destination.exists())
        self.assertFalse(list(self.root.glob('.pppoppi-import-*')))


if __name__ == '__main__':
    unittest.main()
