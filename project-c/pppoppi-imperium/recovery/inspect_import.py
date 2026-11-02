#!/usr/bin/env python3
"""Nur lesende Diagnose eines vorhandenen V1.9.4-Importziels.

Kein automatisches Reparieren, Fortsetzen, Loeschen oder Ueberschreiben.
CHECKED bedeutet ausschliesslich: Inventar beim Prueflauf konsistent.
"""
import argparse
import os
from pathlib import Path
import stat
import sys

from verify_sources import SourceBlocked, SourceInvalid, validate_sources

ALLOWED_ROOT_NAMES = frozenset({'SPIEL', 'WIEDERHERSTELLUNG_MANIFEST.json'})
SAFE_DIRFD = (os.name == 'posix' and hasattr(os, 'O_NOFOLLOW') and
              hasattr(os, 'O_DIRECTORY'))


def inspect_destination(destination, *, verification=None):
    """Liefert (Status, Begruendung), ohne Dateien zu veraendern.

    Auch CHECKED ist keine Sperre gegen einen nachfolgenden Schreibzugriff:
    bei konkurrierenden Aenderungen muss erneut geprueft werden.
    """
    root = Path(destination)
    if not SAFE_DIRFD:
        return 'BLOCKED', 'Sichere Verzeichnispruefung auf diesem System nicht verfuegbar'
    try:
        fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    except FileNotFoundError:
        return 'MISSING', 'Zielordner existiert nicht; Import nur in neuen Ordner'
    except OSError as exc:
        return 'UNSAFE', f'Zielordner nicht sicher oeffenbar: {exc}'
    try:
        identity = os.fstat(fd)
        if not stat.S_ISDIR(identity.st_mode):
            return 'UNSAFE', 'Ziel ist kein Verzeichnis'
        try:
            with os.scandir(fd) as scanner:
                entries = {}
                for entry in scanner:
                    if entry.is_symlink():
                        return 'UNSAFE', f'Symbolischer Link im Ziel: {entry.name}'
                    entries[entry.name] = (
                        entry.is_dir(follow_symlinks=False),
                        entry.is_file(follow_symlinks=False),
                    )
        except OSError as exc:
            return 'UNSAFE', f'Zielinhalt nicht lesbar: {exc}'
        foreign = sorted(set(entries) - ALLOWED_ROOT_NAMES)
        if foreign:
            return 'FOREIGN', f'Unbekannte Eintraege im Ziel: {foreign!r}'
        if 'SPIEL' not in entries:
            return 'INCOMPLETE', 'SPIEL fehlt; nicht als Import benutzen'
        if not entries['SPIEL'][0]:
            return 'UNSAFE', 'SPIEL ist kein regulaeres Verzeichnis'
        if 'WIEDERHERSTELLUNG_MANIFEST.json' not in entries:
            return 'INCOMPLETE', 'Manifest fehlt; Teilimport nicht benutzen'
        if not entries['WIEDERHERSTELLUNG_MANIFEST.json'][1]:
            return 'UNSAFE', 'Manifest ist keine regulaere Datei'
        try:
            count = validate_sources(root, **(verification or {}))
        except SourceBlocked as exc:
            return 'INCOMPLETE', f'Quellen fehlen: {exc}'
        except (SourceInvalid, OSError, ValueError) as exc:
            return 'INVALID', f'Quellenpruefung fehlgeschlagen: {exc}'
        try:
            current = os.lstat(root)
        except OSError as exc:
            return 'UNSAFE', f'Ziel nach Pruefung nicht mehr erreichbar: {exc}'
        if (not stat.S_ISDIR(current.st_mode) or
                (current.st_dev, current.st_ino) !=
                (identity.st_dev, identity.st_ino)):
            return 'UNSAFE', 'Zielordner waehrend der Pruefung ausgetauscht'
        return 'CHECKED', f'{count} Quellen beim Prueflauf konsistent; keine Spielfreigabe'
    finally:
        os.close(fd)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Importziel nur lesend untersuchen')
    parser.add_argument('--destination', required=True, type=Path)
    args = parser.parse_args(argv)
    status, detail = inspect_destination(args.destination)
    print(f'{status}: {detail}')
    if status == 'CHECKED':
        return 0
    if status in ('MISSING', 'INCOMPLETE', 'BLOCKED'):
        return 1
    return 2


if __name__ == '__main__':
    sys.exit(main())
