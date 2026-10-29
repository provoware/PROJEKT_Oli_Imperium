#!/usr/bin/env python3
"""Inventar-Pruefung fuer eingecheckte Laufzeitmedien; keine Rechtefreigabe.

Erfasst ausschliesslich versionierte Mediendateien unter SPIEL/. Nicht erfasst:
Netzwerk-/Laufzeitdownloads, externe Archive, dynamisch erzeugte Ressourcen.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path, PurePosixPath

GAME = 'project-c/pppoppi-imperium/SPIEL/'
MEDIA = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico',
         '.mp3', '.wav', '.ogg', '.flac', '.mp4', '.webm', '.woff', '.woff2',
         '.ttf', '.otf'}
MANIFEST = 'project-c/pppoppi-imperium/prerelease/runtime_asset_manifest.json'


def safe_path(value):
    if not isinstance(value, str) or not value or '\\' in value:
        return False
    p = PurePosixPath(value)
    return not p.is_absolute() and all(part not in ('.', '..') for part in value.split('/')) and '//' not in value


def audit(root, tracked, manifest):
    """Return (errors, count); rights are checked for documentation, not legally certified."""
    errors = []
    if not isinstance(manifest, dict) or manifest.get('schema_version') != 1 or not isinstance(manifest.get('assets'), list):
        return ['Ungueltiges Manifest (Schema 1, assets-Liste erforderlich).'], 0
    media = {p for p in tracked if p.startswith(GAME) and PurePosixPath(p).suffix.lower() in MEDIA}
    entries = {}
    for i, entry in enumerate(manifest['assets']):
        if not isinstance(entry, dict):
            errors.append(f'Eintrag {i}: Objekt erwartet')
            continue
        p = entry.get('path')
        if not safe_path(p) or not p.startswith(GAME) or PurePosixPath(p).suffix.lower() not in MEDIA:
            errors.append(f'Eintrag {i}: unzulaessiger Medienpfad')
            continue
        if p in entries:
            errors.append(f'Doppelter Medienpfad: {p}')
        entries[p] = entry
    for p in sorted(media - entries.keys()):
        errors.append(f'Nicht dokumentiertes Laufzeitmedium: {p}')
    for p in sorted(entries.keys() - media):
        errors.append(f'Manifesteintrag ohne versionierte Laufzeitdatei: {p}')
    for p in sorted(media & entries.keys()):
        entry = entries[p]
        asset = root / p
        if asset.is_symlink() or not asset.is_file() or not asset.resolve().is_relative_to(root.resolve()):
            errors.append(f'Unzulaessige Laufzeitdatei: {p}')
            continue
        digest = hashlib.sha256(asset.read_bytes()).hexdigest()
        if entry.get('sha256') != digest:
            errors.append(f'Falscher SHA-256: {p}')
        rights = entry.get('rights')
        evidence = entry.get('rights_evidence')
        if not isinstance(rights, str) or not rights.strip() or rights.lower() in ('unknown', 'unbekannt', 'todo'):
            errors.append(f'Keine dokumentierte Nutzungsgrundlage: {p}')
        if not safe_path(evidence):
            errors.append(f'Fehlender sicherer Rechtenachweis: {p}')
        else:
            proof = root / evidence
            if proof.is_symlink() or not proof.is_file() or not proof.resolve().is_relative_to(root.resolve()):
                errors.append(f'Rechtenachweis nicht vorhanden: {p}')
    return errors, len(media)


def main():
    root = Path(__file__).resolve().parents[3]
    try:
        tracked = subprocess.run(['git', 'ls-files', '-z', '--', GAME], cwd=root,
                                 check=True, capture_output=True).stdout.decode('utf-8').split('\0')
        manifest = json.loads((root / MANIFEST).read_text(encoding='utf-8'))
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print('FAIL: Inventar nicht lesbar:', exc, file=sys.stderr)
        return 2
    errors, count = audit(root, tracked, manifest)
    for error in errors:
        print('FAIL:', error, file=sys.stderr)
    print(f'Inventar: {count} versionierte Laufzeitmedien, {len(manifest["assets"])} dokumentiert; '
          f'{len(errors)} Abweichungen')
    print('HINWEIS: Rechte an ausgeschlossenen Archiven und externen Ressourcen sind NICHT freigegeben.')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
