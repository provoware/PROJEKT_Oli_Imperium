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
         '.avif', '.apng', '.jfif', '.mp3', '.wav', '.ogg', '.flac', '.m4a',
         '.aac', '.opus', '.aiff', '.mp4', '.webm', '.mov', '.mkv', '.woff',
         '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.glb', '.gltf'}
MANIFEST = 'project-c/pppoppi-imperium/prerelease/runtime_asset_manifest.json'
# Formale Dokumentationsklassen, keine automatische juristische Freigabe.
RIGHTS = {'own-work', 'public-domain', 'cc0-1.0', 'cc-by-4.0',
          'cc-by-sa-4.0', 'third-party-license'}


def safe_path(value):
    if not isinstance(value, str) or not value or '\\' in value:
        return False
    p = PurePosixPath(value)
    return (not p.is_absolute()
            and all(part not in ('.', '..') for part in value.split('/'))
            and '//' not in value
            and not any(ord(char) < 32 or ord(char) == 127 for char in value))


def sha256_stream(path):
    """Hash files in bounded chunks instead of loading entire media into RAM."""
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def audit(root, tracked, manifest):
    """Return (errors, count); evidence is checked, not legally certified."""
    errors = []
    if not isinstance(manifest, dict) or manifest.get('schema_version') != 1 or not isinstance(manifest.get('assets'), list):
        return ['Ungueltiges Manifest (Schema 1, assets-Liste erforderlich).'], 0
    tracked = set(tracked)
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
        try:
            digest = sha256_stream(asset)
        except OSError as exc:
            errors.append(f'Laufzeitmedium nicht lesbar: {p} ({type(exc).__name__})')
            continue
        if entry.get('sha256') != digest:
            errors.append(f'Falscher SHA-256: {p}')
        rights = entry.get('rights')
        evidence = entry.get('rights_evidence')
        if not isinstance(rights, str) or rights not in RIGHTS:
            errors.append(f'Keine dokumentierte Nutzungsgrundlage: {p}')
        if not safe_path(evidence) or evidence == p:
            errors.append(f'Fehlender sicherer Rechtenachweis: {p}')
        else:
            proof = root / evidence
            if proof.is_symlink() or not proof.is_file() or not proof.resolve().is_relative_to(root.resolve()):
                errors.append(f'Rechtenachweis nicht vorhanden: {p}')
            elif evidence not in tracked:
                errors.append(f'Rechtenachweis nicht versioniert: {p}')
            else:
                try:
                    if proof.stat().st_size == 0:
                        errors.append(f'Rechtenachweis leer: {p}')
                except OSError as exc:
                    errors.append(f'Rechtenachweis nicht lesbar: {p} ({type(exc).__name__})')
    return errors, len(media)


def main():
    root = Path(__file__).resolve().parents[3]
    try:
        tracked = subprocess.run(['git', 'ls-files', '-z'], cwd=root,
                                 check=True, capture_output=True).stdout.decode('utf-8').split('\0')
        manifest = json.loads((root / MANIFEST).read_text(encoding='utf-8'))
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print('FAIL: Inventar nicht lesbar:', exc, file=sys.stderr)
        return 2
    errors, count = audit(root, tracked, manifest)
    for error in errors:
        print('FAIL:', error, file=sys.stderr)
    assets = manifest.get('assets') if isinstance(manifest, dict) else None
    documented = len(assets) if isinstance(assets, list) else 0
    print(f'Inventar: {count} versionierte Laufzeitmedien, {documented} dokumentiert; '
          f'{len(errors)} Abweichungen')
    print('HINWEIS: Rechte an ausgeschlossenen Archiven und externen Ressourcen sind NICHT freigegeben.')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
