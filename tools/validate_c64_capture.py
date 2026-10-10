#!/usr/bin/env python3
"""Prüft eine private C64-Aufnahmeakte; bewertet NIEMALS historische Wahrheit.

Standardbibliothek, kein Emulator, keine Veröffentlichung und kein Einlesen
von Disketteninhalten. Die Vorlage enthält bewusst keine Originalbeweise.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "data" / "original-session.template.json"
HASH = re.compile(r"^[0-9a-f]{64}$", re.ASCII)
TEST_IDS = ("TEST-001", "TEST-002", "TEST-003")
SCREENS = re.compile(r"^SCREEN-[0-9]{3}$", re.ASCII)


def filled(value):
    return isinstance(value, str) and 1 <= len(value.strip()) <= 500


def valid_sha256(value):
    return isinstance(value, str) and HASH.fullmatch(value) is not None


def validate_capture(document):
    """(Liste von Strukturfehlern, vom Nutzer zu klärende Anforderungen).

    Diese Prüfung ist kein Beleg für Echtheit, Lizenz oder C64-Originaltreue.
    Selbst vollständig erfasste Beobachtungen benötigen eine externe Fachprüfung.
    """
    errors = []
    missing = []
    if not isinstance(document, dict):
        return ["Die Aufnahmeakte muss ein JSON-Objekt sein."], []
    if document.get("schema_version") != 1 or document.get("kind") != "c64-original-session-record":
        errors.append("Unbekanntes C64-Aufnahmeformat oder Schema.")
    status = document.get("reference_status")
    if status not in ("not_recorded", "captured"):
        errors.append("Der Aufnahmestatus darf nur not_recorded oder captured sein.")

    if document.get("source_id") != "SRC-004":
        errors.append("Unerwarteter Archivkandidat; Quellen-ID ist zu prüfen.")
    for field in ("edition_description", "legal_use_basis"):
        value = document.get(field)
        if value is None:
            missing.append(field)
        elif not filled(value):
            errors.append("Ungültiger oder überlanger Wert: " + field)

    disks = document.get("original_files")
    if not isinstance(disks, list) or len(disks) != 2 or {
        row.get("disk_side") for row in disks if isinstance(row, dict)
    } != {"s0", "s1"}:
        errors.append("Genau die zwei Diskettenseiten s0 und s1 werden erwartet.")
    else:
        for disk in disks:
            side = disk["disk_side"]
            if disk.get("format") != "g64":
                errors.append("Unbekanntes Datenträgerformat für " + side)
            sha = disk.get("sha256")
            if sha is None:
                missing.append(side + ".sha256")
            elif not valid_sha256(sha):
                errors.append("Ungültiger SHA-256 für " + side)
            size = disk.get("bytes")
            if size is None:
                missing.append(side + ".bytes")
            elif type(size) is not int or not (1 <= size <= 20000000):
                errors.append("Ungültige G64-Dateigröße für " + side)
        digests = [item.get("sha256") for item in disks]
        if all(valid_sha256(x) for x in digests) and digests[0] == digests[1]:
            errors.append("Beide Datenträgerseiten besitzen denselben Hash; Seitenzuordnung prüfen.")

    emulator = document.get("emulator")
    if not isinstance(emulator, dict) or emulator.get("name") != "VICE" or (
        emulator.get("model") != "C64" or emulator.get("video_standard") != "PAL"
    ):
        errors.append("Emulator muss für diesen Referenzkandidaten VICE/C64/PAL sein.")
    else:
        version = emulator.get("version")
        if version is None:
            missing.append("emulator.version")
        elif not filled(version):
            errors.append("Ungültige Emulatorversion.")

    tests = document.get("test_observations")
    if not isinstance(tests, list) or len(tests) != len(TEST_IDS) or any(
        not isinstance(t, dict) for t in tests
    ):
        errors.append("Die drei Testkarten müssen vorhanden sein.")
    elif {t.get("test_id") for t in tests} != set(TEST_IDS):
        errors.append("Originaltests fehlen oder sind doppelt.")
    else:
        for entry in tests:
            test_id = entry["test_id"]
            test_status = entry.get("status")
            if test_status not in ("not_run", "recorded"):
                errors.append(test_id + ": nur not_run/recorded zulässig; bestanden wird nie automatisch gesetzt.")
            steps = entry.get("observed_navigation")
            captures = entry.get("screen_captures")
            if not isinstance(steps, list) or not isinstance(captures, list):
                errors.append(test_id + ": Navigation und Bildschirmbelege müssen Listen sein.")
                continue
            seen = set()
            for capture in captures:
                if not isinstance(capture, dict):
                    errors.append(test_id + ": beschädigter Bildschirmbeleg.")
                    continue
                name = capture.get("file_name")
                sha = capture.get("sha256")
                if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,100}\.png", name) or (
                    name.startswith(".") or ".." in name or name in seen
                ):
                    errors.append(test_id + ": unzulässiger oder doppelter PNG-Dateiname.")
                else:
                    seen.add(name)
                if not valid_sha256(sha) or not filled(capture.get("description")):
                    errors.append(test_id + ": PNG-Prüfsumme oder Bildbeschreibung ungültig.")
            for index, step in enumerate(steps, 1):
                if not isinstance(step, dict) or step.get("sequence") != index:
                    errors.append(test_id + ": Schrittfolge ist nicht lückenlos.")
                    continue
                if not (filled(step.get("input_description")) and
                        filled(step.get("observed_screen_label"))):
                    errors.append(test_id + ": Eingabe/Bildschirmbeobachtung fehlt.")
                screen_id = step.get("screen_id")
                if screen_id is not None and (
                    not isinstance(screen_id, str) or not SCREENS.fullmatch(screen_id)
                ):
                    errors.append(test_id + ": unbekannte SCREEN-ID.")
                capture_id = step.get("capture_file")
                if capture_id is not None and capture_id not in seen:
                    errors.append(test_id + ": Schritt verweist auf fehlenden PNG-Beleg.")
            description = entry.get("description")
            if test_status == "recorded":
                if not filled(description) or not steps or not captures:
                    errors.append(test_id + ": aufgezeichneter Test benötigt Beschreibung, Eingaben und PNG-Beleg.")
            else:
                missing.append(test_id + ": noch kein Originaltest aufgenommen")
                if steps or captures or description is not None:
                    errors.append(test_id + ": nicht ausgeführter Test darf keine angeblichen Beobachtungen enthalten.")

    if status == "captured" and missing:
        errors.append("Status captured ist unzulässig, solange Nachweise fehlen.")
    return errors, missing


def inspect_capture(document):
    errors, missing = validate_capture(document)
    return {
        "structure_valid": not errors,
        "complete_for_independent_review": not errors and not missing and document.get("reference_status") == "captured",
        "scientifically_verified": False,
        "original_tests_approved": 0,
        "errors": errors,
        "outstanding": missing,
        "note": "Strukturprüfung ist keine Bestätigung der Echtheit oder der Originalspielregeln.",
    }


def main():
    parser = argparse.ArgumentParser(description="Private C64-Aufnahmeakte strukturell prüfen, ohne Originalfreigabe")
    parser.add_argument("file", type=Path, nargs="?", default=TEMPLATE)
    args = parser.parse_args()
    try:
        doc = json.loads(args.file.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print("Aufnahmeakte nicht lesbar:", exc)
        return 2
    report = inspect_capture(doc)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["structure_valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
