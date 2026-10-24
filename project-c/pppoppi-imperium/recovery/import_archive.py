#!/usr/bin/env python3
"""Offline-Import des bereits kuratierten V1.9.4-Quellpakets.

Erzeugt ausschliesslich einen NEUEN Zielordner mit SPIEL/ und Manifest.
Keine Rechtefreigabe, kein GitHub-Upload und keine Spielbarkeitszusage.
"""
import argparse
import hashlib
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import tempfile
import zipfile

from verify_sources import (MAX_MANIFEST_BYTES, SourceBlocked, SourceInvalid,
                            validate_sources)

SAFE_ARCHIVE_SHA256 = '54ab598afc58fdf06cb250c33dda08bb0dc4077b8e8b31c328df868a94e809f4'
ZIP_PREFIX = 'project-c/pppoppi-imperium/'
MAX_ARCHIVE_BYTES = 4_194_304
MAX_MEMBER_BYTES = 2_097_152
MAX_TOTAL_BYTES = 8_388_608


class ImportRejected(Exception):
    """Der Import darf nicht ausgefuehrt werden."""


def _sha256(stream):
    stream.seek(0)
    digest = hashlib.sha256()
    while chunk := stream.read(65536):
        digest.update(chunk)
    return digest.hexdigest()


def _member_destination(info):
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
        if not name.startswith(ZIP_PREFIX):
            raise ImportRejected(f'Fremdes ZIP-Verzeichnis: {name!r}')
        return None
    if filetype == stat.S_IFDIR:
        raise ImportRejected(f'ZIP-Datei mit Verzeichnistyp: {name!r}')
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


def prepare_import(archive_path, destination, *,
                   expected_archive_sha256=SAFE_ARCHIVE_SHA256,
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
            if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > MAX_ARCHIVE_BYTES:
                raise ImportRejected('Archiv ist keine regulaere Datei oder zu gross')
            if _sha256(source) != expected_archive_sha256:
                raise ImportRejected('Archiv-SHA-256 weicht vom freigegebenen Paket ab')
            staging = Path(tempfile.mkdtemp(prefix='.pppoppi-import-', dir=parent))
            try:
                _extract_verified_zip(source, staging)
                if _sha256(source) != expected_archive_sha256:
                    raise ImportRejected('Archiv wurde waehrend des Imports veraendert')
                count = validate_sources(staging, **(verification or {}))
                destination.mkdir(mode=0o700)  # Exklusiv: auch leere Zielordner niemals ersetzen.
                try:
                    os.rename(staging / 'SPIEL', destination / 'SPIEL')
                    os.rename(staging / 'WIEDERHERSTELLUNG_MANIFEST.json',
                              destination / 'WIEDERHERSTELLUNG_MANIFEST.json')
                    validate_sources(destination, **(verification or {}))
                except Exception:
                    shutil.rmtree(destination)
                    raise
                return count
            finally:
                shutil.rmtree(staging, ignore_errors=True)
    except (OSError, ValueError, zipfile.BadZipFile, SourceBlocked, SourceInvalid) as exc:
        raise ImportRejected(f'Quellimport abgelehnt: {exc}') from exc


def main(argv=None):
    parser = argparse.ArgumentParser(description='V1.9.4-Quellen sicher lokal vorbereiten (kein Upload)')
    parser.add_argument('--archive', required=True, type=Path,
                        help='Unveraendertes PPPOPPI_IMPERIUM_V194_GITHUB_QUELLCODE_SICHER.zip')
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
