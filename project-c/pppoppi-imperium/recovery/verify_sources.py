#!/usr/bin/env python3
"""Prueft den freigegebenen V1.9.4-Quellimport ohne Fremdpakete.

Der feste Inventar-Fingerabdruck wurde aus dem am 23.10.2026 erneut
gegen das Original-ZIP geprueften Quellpaket abgeleitet. Er bindet
alle 110 relativen Pfade an ihre SHA-256-Werte; reine Manifest-Selbstauskunft
genuegt nicht. Der Check beweist keine Urheberrechte oder Spielfreigabe.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys

EXPECTED_SOURCE_SHA256 = '94f41725f1d1addaa07505302a4f448e3410df0bcebe68bfb24fc07b72d433ca'
EXPECTED_INVENTORY_SHA256 = '2514ffd8b641d8ed230ff6c9a461f309d0874c3820ad872ffcc1e5b814e39913'
EXPECTED_COUNT = 110
EXPECTED_ARCHIVE_ENTRIES = 187
ALLOWED_EXTENSIONS = frozenset({'.js', '.css', '.cjs', '.html', '.py', '.json', '.txt', '.md', '.sh'})
REQUIRED = frozenset({'SPIEL/index.html', 'SPIEL/src/neo_bridge.js', 'SPIEL/src/strategy_logistics_v193.js'})
SHA256 = re.compile(r'[0-9a-f]{64}\Z')


class SourceBlocked(Exception):
    """Eine benoetigte Quelldatei fehlt."""


class SourceInvalid(Exception):
    """Ein vorhandener Import ist inkonsistent oder manipuliert."""


def inventory_digest(entries):
    """Stabile UTF-8-JSON-Darstellung der sortierten (Pfad, Hash)-Paare."""
    pairs = sorted((entry['path'], entry['sha256']) for entry in entries)
    return hashlib.sha256(json.dumps(pairs, ensure_ascii=False,
                                    separators=(',', ':')).encode('utf-8')).hexdigest()


def reject_duplicate_json_keys(pairs):
    """JSON mit mehrdeutigen Schluesseln darf keinen Quellimport freigeben."""
    result = {}
    for key, value in pairs:
        if key in result:
            raise SourceInvalid(f'Doppelter JSON-Schluessel: {key!r}')
        result[key] = value
    return result


def validate_sources(root, *, expected_inventory_sha256=EXPECTED_INVENTORY_SHA256,
                     expected_count=EXPECTED_COUNT,
                     expected_source_sha256=EXPECTED_SOURCE_SHA256,
                     expected_archive_entries=EXPECTED_ARCHIVE_ENTRIES):
    root = Path(root)
    if root.is_symlink():
        raise SourceInvalid('Import-Wurzel ist ein symbolischer Link')
    manifest = root / 'WIEDERHERSTELLUNG_MANIFEST.json'
    if manifest.is_symlink():
        raise SourceInvalid('WIEDERHERSTELLUNG_MANIFEST.json ist ein symbolischer Link')
    if not manifest.is_file():
        raise SourceBlocked('WIEDERHERSTELLUNG_MANIFEST.json fehlt')
    try:
        data = json.loads(manifest.read_text(encoding='utf-8'),
                          object_pairs_hook=reject_duplicate_json_keys)
    except (OSError, UnicodeError, ValueError) as exc:
        raise SourceInvalid(f'Manifest unlesbar: {exc}') from exc
    if not isinstance(data, dict):
        raise SourceInvalid('Manifest muss ein Objekt sein')
    if (data.get('source_sha256') != expected_source_sha256 or
            data.get('source_entries') != expected_archive_entries):
        raise SourceInvalid('Originalpaket-Herkunft weicht ab')
    entries = data.get('files')
    if (not isinstance(entries, list) or len(entries) != expected_count or
            type(data.get('total_files')) is not int or data['total_files'] != expected_count):
        raise SourceInvalid(f'Genau {expected_count} Quelldateien erforderlich')
    seen = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise SourceInvalid(f'Eintrag {index} ist kein Objekt')
        name, digest, size = entry.get('path'), entry.get('sha256'), entry.get('size')
        if not isinstance(name, str) or not isinstance(digest, str):
            raise SourceInvalid(f'Eintrag {index}: Pfad oder Hash ungueltig')
        parts = name.split('/')
        rel = PurePosixPath(name)
        if (len(parts) < 2 or parts[0] != 'SPIEL' or
                any(part in ('', '.', '..') for part in parts) or
                '\\' in name or '\x00' in name or any(ord(c) < 32 for c in name) or
                rel.is_absolute() or rel.suffix not in ALLOWED_EXTENSIONS or
                name in seen):
            raise SourceInvalid(f'Unerlaubter oder doppelter Pfad: {name!r}')
        if not SHA256.fullmatch(digest) or type(size) is not int or size < 0:
            raise SourceInvalid(f'Ungueltige Pruefsumme oder Dateigroesse: {name}')
        seen.add(name)
    if not REQUIRED.issubset(seen):
        raise SourceInvalid('Pflicht-Startdateien fehlen im Inventar')
    if inventory_digest(entries) != expected_inventory_sha256:
        raise SourceInvalid('Inventar weicht vom geprueften Originalpaket ab')
    if (root / 'SPIEL').is_symlink() or not (root / 'SPIEL').is_dir():
        raise SourceBlocked('SPIEL-Verzeichnis fehlt oder ist ein Link')
    for entry in entries:
        name = entry['path']
        target = root / name
        for parent in [target, *target.parents]:
            if parent == root:
                break
            if parent.is_symlink():
                raise SourceInvalid(f'Symbolischer Link im Quellpfad: {name}')
        if not target.is_file():
            raise SourceBlocked(f'Quelldatei fehlt: {name}')
        if target.stat().st_size != entry['size']:
            raise SourceInvalid(f'Dateigroesse falsch: {name}')
        if hashlib.sha256(target.read_bytes()).hexdigest() != entry['sha256']:
            raise SourceInvalid(f'Dateipruefsumme falsch: {name}')
    expected_dirs = {'SPIEL'}
    for name in seen:
        parent = PurePosixPath(name).parent
        while str(parent) != '.':
            expected_dirs.add(parent.as_posix())
            parent = parent.parent
    actual = set()
    for target in (root / 'SPIEL').rglob('*'):
        relative = target.relative_to(root).as_posix()
        if target.is_symlink():
            raise SourceInvalid(f'Link statt Quelldatei: {relative}')
        if target.is_dir():
            if relative not in expected_dirs:
                raise SourceInvalid(f'Nicht freigegebenes Verzeichnis: {relative}')
        elif target.is_file():
            actual.add(relative)
        else:
            raise SourceInvalid(f'Unerlaubter Dateityp: {relative}')
    if actual != seen:
        raise SourceInvalid(f'Inventarabweichung: {len(actual-seen)} zusaetzlich, {len(seen-actual)} fehlen')
    return len(seen)


def main():
    root = Path(__file__).resolve().parents[1]
    try:
        count = validate_sources(root)
    except SourceBlocked as exc:
        print(f'BLOCKED: {exc}', file=sys.stderr)
        return 1
    except (SourceInvalid, OSError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 2
    print(f'PASS: {count} Quell-/Testdateien mit festem Inventar und SHA-256 geprueft')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
