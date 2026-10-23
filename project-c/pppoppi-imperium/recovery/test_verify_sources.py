"""Negative Tests fuer den Quellimport, ohne reale Spielquellen in CI."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from verify_sources import (SourceBlocked, SourceInvalid,
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


if __name__ == '__main__':
    unittest.main()
