#!/usr/bin/env python3
"""Offline-Import des bereits kuratierten V1.9.4-Quellpakets.

Erzeugt ausschliesslich einen NEUEN Zielordner mit SPIEL/ und Manifest.
Keine Rechtefreigabe, kein GitHub-Upload und keine Spielbarkeitszusage.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import tempfile
import zipfile

from verify_sources import (ALLOWED_EXTENSIONS, EXPECTED_ARCHIVE_ENTRIES,
                            EXPECTED_COUNT, EXPECTED_INVENTORY_SHA256,
                            EXPECTED_SOURCE_SHA256, MAX_MANIFEST_BYTES,
                            SourceBlocked, SourceInvalid, inventory_digest,
                            validate_sources)

SAFE_ARCHIVE_SHA256 = '54ab598afc58fdf06cb250c33dda08bb0dc4077b8e8b31c328df868a94e809f4'
ZIP_PREFIX = 'project-c/pppoppi-imperium/'
MAX_ARCHIVE_BYTES = 268_435_456  # Original-ZIP kann Bild-/Berichtsmedien enthalten.
MAX_MEMBER_BYTES = 2_097_152
MAX_TOTAL_BYTES = 8_388_608
SAFE_DIRFD_INSTALL = (os.name == 'posix' and hasattr(os, 'O_NOFOLLOW') and
                      hasattr(os, 'O_DIRECTORY') and os.rename in os.supports_dir_fd)


class ImportRejected(Exception):
    """Der Import darf nicht ausgefuehrt werden."""


def _sha256(stream, expected_size):
    """Hash nur ueber die anfangs gemessene Archivgroesse.

    Wachsende Dateien duerfen den Hashlauf nicht unbegrenzt verlaengern;
    ein vorzeitig beendeter Leselauf darf nicht als vollstaendig gelten.
    """
    stream.seek(0)
    digest = hashlib.sha256()
    total = 0
    while chunk := stream.read(min(65536, expected_size - total + 1)):
        total += len(chunk)
        if total > expected_size:
            raise ImportRejected('Archiv ist waehrend der Pruefung gewachsen')
        digest.update(chunk)
    if total != expected_size:
        raise ImportRejected('Archiv ist waehrend der Pruefung verkuerzt')
    return digest.hexdigest()


def _check_zip_member(info):
    name = info.filename
    parts = name.split('/')
    if (not name or name.startswith('/') or '\\' in name or '\x00' in name or
            any(ord(char) < 32 for char in name) or
            any(part in ('', '.', '..') for part in parts[:-1]) or
            (not info.is_dir() and parts[-1] in ('', '.', '..'))):
        raise ImportRejected(f'Ungueltiger ZIP-Pfad: {name!r}')
    mode = (info.external_attr >> 16) & 0xffff
    filetype = stat.S_IFMT(mode)
    if filetype not in (0, stat.S_IFREG, stat.S_IFDIR):
        raise ImportRejected(f'Sonderdatei oder Link im ZIP: {name!r}')
    if info.is_dir():
        if filetype == stat.S_IFREG:
            raise ImportRejected(f'ZIP-Verzeichnis mit Dateityp: {name!r}')
    elif filetype == stat.S_IFDIR:
        raise ImportRejected(f'ZIP-Datei mit Verzeichnistyp: {name!r}')
    return name


def _member_destination(info):
    name = _check_zip_member(info)
    if info.is_dir():
        if not name.startswith(ZIP_PREFIX):
            raise ImportRejected(f'Fremdes ZIP-Verzeichnis: {name!r}')
        return None
    if name == ZIP_PREFIX + 'QUELLIMPORT_HINWEIS.md':
        return None  # Nur Hinweistext; nicht Bestandteil des Quellinventars.
    if name == ZIP_PREFIX + 'WIEDERHERSTELLUNG_MANIFEST.json':
        return 'WIEDERHERSTELLUNG_MANIFEST.json'
    if name.startswith(ZIP_PREFIX + 'SPIEL/'):
        relative = name[len(ZIP_PREFIX):]
        if len(PurePosixPath(relative).parts) < 2:
            raise ImportRejected(f'Unvollstaendiger Quellpfad: {name!r}')
        return relative
    raise ImportRejected(f'Nicht freigegebener ZIP-Eintrag: {name!r}')


def _extract_verified_zip(stream, staging):
    stream.seek(0)
    with zipfile.ZipFile(stream) as archive:
        mapped = []
        seen_names, seen_destinations = set(), set()
        total = 0
        for info in archive.infolist():
            if info.filename in seen_names:
                raise ImportRejected(f'Doppelter ZIP-Eintrag: {info.filename!r}')
            seen_names.add(info.filename)
            relative = _member_destination(info)
            if relative is None:
                continue
            if relative in seen_destinations:
                raise ImportRejected(f'Doppeltes Importziel: {relative!r}')
            seen_destinations.add(relative)
            limit = MAX_MANIFEST_BYTES if relative == 'WIEDERHERSTELLUNG_MANIFEST.json' else MAX_MEMBER_BYTES
            if info.file_size > limit or info.file_size < 0:
                raise ImportRejected(f'ZIP-Eintrag zu gross: {info.filename!r}')
            total += info.file_size
            if total > MAX_TOTAL_BYTES:
                raise ImportRejected('ZIP-Quellumfang zu gross')
            mapped.append((info, relative, limit))
        for info, relative, limit in mapped:
            target = staging / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            count = 0
            with archive.open(info) as source, target.open('xb') as output:
                while chunk := source.read(65536):
                    count += len(chunk)
                    if count > limit or count > info.file_size:
                        raise ImportRejected(f'Entpacklimit ueberschritten: {relative}')
                    output.write(chunk)
            if count != info.file_size:
                raise ImportRejected(f'Unvollstaendig entpackt: {relative}')


def _extract_original_zip(stream, staging, verification):
    """Extrahiert nur erlaubte Quelltexte aus dem fest gepinnten Original-ZIP."""
    source_sha = verification.get('expected_source_sha256', EXPECTED_SOURCE_SHA256)
    entry_count = verification.get('expected_archive_entries', EXPECTED_ARCHIVE_ENTRIES)
    required_count = verification.get('expected_count', EXPECTED_COUNT)
    required_inventory = verification.get('expected_inventory_sha256',
                                           EXPECTED_INVENTORY_SHA256)
    stream.seek(0)
    entries, seen, total = [], set(), 0
    with zipfile.ZipFile(stream) as archive:
        infos = archive.infolist()
        if len(infos) != entry_count:
            raise ImportRejected(f'Original-ZIP muss {entry_count} Eintraege enthalten')
        for info in infos:
            name = _check_zip_member(info)
            if name in seen:
                raise ImportRejected(f'Doppelter Original-ZIP-Eintrag: {name!r}')
            seen.add(name)
            if info.is_dir() or not name.startswith('SPIEL/'):
                continue
            if PurePosixPath(name).suffix not in ALLOWED_EXTENSIONS:
                continue  # Medien und andere Nichtquellen bleiben ausgeschlossen.
            if info.file_size < 0 or info.file_size > MAX_MEMBER_BYTES:
                raise ImportRejected(f'Original-Quelldatei zu gross: {name!r}')
            total += info.file_size
            if total > MAX_TOTAL_BYTES:
                raise ImportRejected('Original-Quellumfang zu gross')
            target = staging / name
            target.parent.mkdir(parents=True, exist_ok=True)
            size = 0
            digest = hashlib.sha256()
            with archive.open(info) as source, target.open('xb') as output:
                while chunk := source.read(65536):
                    size += len(chunk)
                    if size > MAX_MEMBER_BYTES or size > info.file_size:
                        raise ImportRejected(f'Originaldatei zu gross: {name!r}')
                    output.write(chunk)
                    digest.update(chunk)
            if size != info.file_size:
                raise ImportRejected(f'Originaldatei unvollstaendig: {name!r}')
            entries.append({'path': name, 'sha256': digest.hexdigest(), 'size': size})
    if len(entries) != required_count or inventory_digest(entries) != required_inventory:
        raise ImportRejected('Originalquellen entsprechen nicht dem festen 110-Dateien-Inventar')
    manifest = {'source_sha256': source_sha, 'source_entries': entry_count,
                'total_files': len(entries), 'files': sorted(entries, key=lambda x: x['path'])}
    (staging / 'WIEDERHERSTELLUNG_MANIFEST.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')


def prepare_import(archive_path, destination, *,
                   expected_archive_sha256=SAFE_ARCHIVE_SHA256,
                   expected_original_sha256=EXPECTED_SOURCE_SHA256,
                   verification=None):
    """Prueft ZIP und Dateien, installiert nur in einen nicht existierenden Ordner.

    Die abweichenden erwarteten Werte dienen ausschliesslich synthetischen Tests.
    Die Kommandozeile verwendet immer die fest verdrahteten Originalwerte.
    """
    archive_path, destination = Path(archive_path), Path(destination)
    parent = destination.parent
    if not parent.is_dir() or parent.is_symlink():
        raise ImportRejected('Ziel-Elternordner fehlt oder ist ein Link')
    if os.path.lexists(destination):
        raise ImportRejected('Ziel existiert bereits; keine Ueberschreibung')
    flags = os.O_RDONLY | getattr(os, 'O_BINARY', 0)
    flags |= getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0)
    try:
        fd = os.open(archive_path, flags)
    except OSError as exc:
        raise ImportRejected(f'Archiv nicht sicher oeffenbar: {exc}') from exc
    try:
        with os.fdopen(fd, 'rb') as source:
            metadata = os.fstat(source.fileno())
            if (not stat.S_ISREG(metadata.st_mode) or
                    metadata.st_size < 0 or metadata.st_size > MAX_ARCHIVE_BYTES):
                raise ImportRejected('Archiv ist keine regulaere Datei oder zu gross')
            archive_digest = _sha256(source, metadata.st_size)
            if os.fstat(source.fileno()).st_size != metadata.st_size:
                raise ImportRejected('Archivgroesse hat sich waehrend des Hashens geaendert')
            if archive_digest not in (expected_archive_sha256, expected_original_sha256):
                raise ImportRejected('Archiv-SHA-256 weicht von beiden freigegebenen Paketen ab')
            staging = Path(tempfile.mkdtemp(prefix='.pppoppi-import-', dir=parent))
            try:
                if archive_digest == expected_original_sha256:
                    _extract_original_zip(source, staging, verification or {})
                else:
                    _extract_verified_zip(source, staging)
                if (_sha256(source, metadata.st_size) != archive_digest or
                        os.fstat(source.fileno()).st_size != metadata.st_size):
                    raise ImportRejected('Archiv wurde waehrend des Imports veraendert')
                count = validate_sources(staging, **(verification or {}))
                # POSIX-Verzeichnisbezug verhindert Umleitung durch spaeteren
                # Symlink-Tausch am sichtbaren Zielpfad. Auf anderen Systemen
                # sicher abbrechen statt ungeschuetzt zu installieren.
                if not SAFE_DIRFD_INSTALL:
                    raise ImportRejected('Sichere Zielinstallation auf diesem System nicht verfuegbar')
                destination.mkdir(mode=0o700)  # Exklusiv, nie bestehende Ordner ersetzen.
                dest_fd = os.open(destination, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
                try:
                    if os.listdir(dest_fd):
                        raise ImportRejected('Neu reservierter Zielordner ist nicht leer')
                    os.rename(staging / 'SPIEL', 'SPIEL', dst_dir_fd=dest_fd)
                    os.rename(staging / 'WIEDERHERSTELLUNG_MANIFEST.json',
                              'WIEDERHERSTELLUNG_MANIFEST.json', dst_dir_fd=dest_fd)
                    # Ein paralleler Umbenenner darf keinen scheinbar
                    # erfolgreichen Import unter einem fremden Pfad erzeugen.
                    identity = os.fstat(dest_fd)
                    for _ in range(2):
                        current = os.lstat(destination)
                        if (not stat.S_ISDIR(current.st_mode) or
                                (current.st_dev, current.st_ino) !=
                                (identity.st_dev, identity.st_ino)):
                            raise ImportRejected('Zielordner waehrend des Imports ausgetauscht')
                        if _ == 0:
                            validate_sources(destination, **(verification or {}))
                finally:
                    os.close(dest_fd)
                # Bei Installationsfehlern niemals einen per Pfad erreichbaren
                # Ordner loeschen: Er koennte inzwischen fremde Daten enthalten.
                # Unvollstaendige Importe bleiben erkennbar und muessen separat
                # untersucht werden; es gibt keine Erfolgsmeldung.
                return count
            finally:
                shutil.rmtree(staging, ignore_errors=True)
    except (OSError, ValueError, zipfile.BadZipFile, SourceBlocked, SourceInvalid) as exc:
        raise ImportRejected(f'Quellimport abgelehnt: {exc}') from exc


def main(argv=None):
    parser = argparse.ArgumentParser(description='V1.9.4-Quellen sicher lokal vorbereiten (kein Upload)')
    parser.add_argument('--archive', required=True, type=Path,
                        help='Unveraendertes Original-ZIP oder kuratiertes GITHUB_QUELLCODE_SICHER.zip')
    parser.add_argument('--destination', required=True, type=Path,
                        help='Neuer, bisher NICHT vorhandener Zielordner')
    args = parser.parse_args(argv)
    try:
        count = prepare_import(args.archive, args.destination)
    except ImportRejected as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 2
    print(f'PASS: {count} Dateien lokal geprueft unter {args.destination}')
    print('BLOCKED: Kein GitHub-Import, keine Rechtepruefung, keine Spielfreigabe.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
