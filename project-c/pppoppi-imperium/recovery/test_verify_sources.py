"""Negative Tests fuer den Quellimport, ohne reale Spielquellen in CI."""
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest

from verify_sources import (MAX_MANIFEST_BYTES, SourceBlocked, SourceInvalid,
                            inventory_digest, validate_sources)


class RecoveryVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ['SPIEL/index.html', 'SPIEL/src/neo_bridge.js',
                     'SPIEL/src/strategy_logistics_v193.js']:
            p = self.root / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('test '+name, encoding='utf-8')
        self.entries = [dict(path=p.relative_to(self.root).as_posix(),
                             sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
                             size=p.stat().st_size)
                        for p in (self.root / 'SPIEL').rglob('*') if p.is_file()]
        self.meta = dict(source_sha256='a'*64, source_entries=4,
                         total_files=3, files=self.entries)
        self.save()

    def save(self):
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            json.dumps(self.meta), encoding='utf-8')

    def verify(self):
        return validate_sources(self.root,
                                expected_inventory_sha256=inventory_digest(self.entries),
                                expected_count=3,
                                expected_source_sha256='a'*64,
                                expected_archive_entries=4)

    def test_source_hashing_does_not_use_unbounded_read_bytes(self):
        from unittest.mock import patch
        with patch.object(Path, 'read_bytes', side_effect=AssertionError('Ganzdatei-Lesen verboten')):
            self.assertEqual(self.verify(), 3)

    def test_empty_source_is_verified_correctly(self):
        target = self.root / 'SPIEL/index.html'
        target.write_bytes(b'')
        entry = next(e for e in self.entries if e['path'] == 'SPIEL/index.html')
        entry['size'] = 0
        entry['sha256'] = hashlib.sha256(b'').hexdigest()
        self.save()
        self.assertEqual(self.verify(), 3)

    @unittest.skipUnless(hasattr(os, 'O_NOFOLLOW'), 'Link-Race-Schutz nur mit O_NOFOLLOW')
    def test_symlink_swap_immediately_before_source_open_fails(self):
        from unittest.mock import patch
        target = self.root / 'SPIEL/index.html'
        original_open = os.open
        swapped = False

        def swap_then_open(path, flags, *args, **kwargs):
            nonlocal swapped
            if Path(path) == target and not swapped:
                swapped = True
                target.unlink()
                target.symlink_to('src/neo_bridge.js')
            return original_open(path, flags, *args, **kwargs)

        with patch('os.open', side_effect=swap_then_open):
            with self.assertRaises(SourceInvalid):
                self.verify()
        self.assertTrue(swapped)

    def test_source_growth_during_open_fails(self):
        from unittest.mock import patch
        target = self.root / 'SPIEL/index.html'
        original_open = os.open
        changed = False

        def grow_then_open(path, flags, *args, **kwargs):
            nonlocal changed
            if Path(path) == target and not changed:
                changed = True
                with target.open('ab') as stream:
                    stream.write(b'added after precheck')
            return original_open(path, flags, *args, **kwargs)

        with patch('os.open', side_effect=grow_then_open):
            with self.assertRaises(SourceInvalid):
                self.verify()
        self.assertTrue(changed)

    def test_source_removed_during_open_blocks(self):
        from unittest.mock import patch
        target = self.root / 'SPIEL/index.html'
        original_open = os.open
        removed = False

        def remove_then_open(path, flags, *args, **kwargs):
            nonlocal removed
            if Path(path) == target and not removed:
                removed = True
                target.unlink()
            return original_open(path, flags, *args, **kwargs)

        with patch('os.open', side_effect=remove_then_open):
            with self.assertRaises(SourceBlocked):
                self.verify()
        self.assertTrue(removed)

    def test_valid_fixture(self):
        self.assertEqual(self.verify(), 3)

    def test_missing_manifest_blocks(self):
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').unlink()
        with self.assertRaises(SourceBlocked): self.verify()

    def test_missing_source_blocks(self):
        (self.root / 'SPIEL/index.html').unlink()
        with self.assertRaises(SourceBlocked): self.verify()

    def test_tampered_source_fails(self):
        (self.root / 'SPIEL/index.html').write_text('verfaelscht', encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_changed_manifest_digest_fails(self):
        self.meta['files'][0]['sha256'] = 'f'*64
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()

    def test_spoofed_provenance_fails(self):
        self.meta['source_sha256'] = 'b'*64
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()

    def test_duplicate_path_fails(self):
        self.meta['files'][1]['path'] = self.meta['files'][0]['path']
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()

    def test_traversal_fails(self):
        self.meta['files'][0]['path'] = 'SPIEL/../index.html'
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()

    def test_extra_file_fails(self):
        (self.root / 'SPIEL/extra.js').write_text('extra', encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_symlink_fails(self):
        target = self.root / 'SPIEL/index.html'
        target.unlink()
        target.symlink_to('src/neo_bridge.js')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_wrong_size_fails(self):
        self.meta['files'][0]['size'] += 1
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()

    def test_control_character_fails(self):
        self.meta['files'][0]['path'] = 'SPIEL/evil\nname.js'
        self.save()
        with self.assertRaises(SourceInvalid): self.verify()


    def test_duplicate_top_level_json_key_fails(self):
        raw = json.dumps(self.meta)
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            raw[:-1] + ', "total_files": 3}', encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_duplicate_nested_json_key_fails(self):
        raw = json.dumps(self.meta)
        key = '"path": ' + json.dumps(self.entries[0]['path'])
        self.assertIn(key, raw)
        raw = raw.replace(key, '"path": "SPIEL/hidden.js", ' + key, 1)
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            raw, encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_manifest_symlink_is_invalid_not_missing(self):
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').unlink()
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').symlink_to('SPIEL/index.html')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_symlinked_import_root_fails(self):
        alias = self.root / 'root_alias'
        alias.symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(SourceInvalid):
            validate_sources(alias, expected_inventory_sha256=inventory_digest(self.entries),
                             expected_count=3, expected_source_sha256='a'*64,
                             expected_archive_entries=4)

    def test_unlisted_empty_directory_fails(self):
        (self.root / 'SPIEL/unlisted').mkdir()
        with self.assertRaises(SourceInvalid): self.verify()

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'FIFO nur auf POSIX')
    def test_unlisted_fifo_fails(self):
        os.mkfifo(self.root / 'SPIEL/unlisted.fifo')
        with self.assertRaises(SourceInvalid): self.verify()



    def test_nonfinite_top_level_number_fails(self):
        raw = json.dumps(self.meta)
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            raw[:-1] + ', "ignored": NaN}', encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_nonfinite_nested_number_fails(self):
        raw = json.dumps(self.meta)
        raw = raw.replace('"path": ', '"ignored": -Infinity, "path": ', 1)
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            raw, encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_oversized_manifest_fails(self):
        (self.root / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
            json.dumps(self.meta) + ' ' * MAX_MANIFEST_BYTES, encoding='utf-8')
        with self.assertRaises(SourceInvalid): self.verify()

    def test_manifest_directory_fails(self):
        manifest = self.root / 'WIEDERHERSTELLUNG_MANIFEST.json'
        manifest.unlink()
        manifest.mkdir()
        with self.assertRaises(SourceInvalid): self.verify()

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'FIFO nur auf POSIX')
    def test_manifest_fifo_fails(self):
        manifest = self.root / 'WIEDERHERSTELLUNG_MANIFEST.json'
        manifest.unlink()
        os.mkfifo(manifest)
        with self.assertRaises(SourceInvalid): self.verify()


if __name__ == '__main__':
    unittest.main()
