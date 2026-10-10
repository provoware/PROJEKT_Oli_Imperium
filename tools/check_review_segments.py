#!/usr/bin/env python3
"""Vier klar abgegrenzte C0-Prüfgruppen: alle ZIP-Dateien genau einmal.

Automatische Gruppenkontrolle prüft Dateiabdeckung, NICHT Fachfreigaben.
"""
from __future__ import annotations

import fnmatch
import json
from pathlib import Path

EXPECTED = ("A", "B", "C", "D")


def inspect_review_segments(document, archive_files, version):
    errors = []
    if not isinstance(document, dict) or document.get("schema_version") != 1 or (
        document.get("kind") != "c0-review-segments"
    ):
        return {"valid": False, "errors": ["Prüfgruppen-Schema ungültig."], "groups": []}
    if document.get("version") != version:
        errors.append("Prüfgruppen-Version stimmt nicht mit C0 überein.")
    if document.get("overall_approval") != "not_granted":
        errors.append("Prüfgruppen dürfen keine Zustimmung vorgeben.")
    groups = document.get("groups")
    if not isinstance(groups, list) or len(groups) != 4 or any(not isinstance(g, dict) for g in groups):
        return {"valid": False, "errors": errors + ["Vier getrennte Prüfgruppen erforderlich."], "groups": []}
    if tuple(group.get("id") for group in groups) != EXPECTED:
        errors.append("Prüfabschnitte müssen eindeutig und geordnet A bis D heißen.")
    files = tuple(archive_files)
    if len(files) != len(set(files)):
        errors.append("Doppelte Datei im Prüfarchiv.")
    coverage = {name: [] for name in files}
    summary = []
    for group in groups:
        ident = group.get("id")
        patterns = group.get("patterns")
        if (not isinstance(patterns, list) or not patterns or
            any(not isinstance(p, str) or not p or p == "*" for p in patterns)):
            errors.append(str(ident) + ": ungültige oder zu breite Dateimuster.")
            continue
        for field in ("title", "scope_note", "human_gate"):
            if not isinstance(group.get(field), str) or not group[field].strip():
                errors.append(str(ident) + ": Prüfzweck/Fachgrenze fehlt: " + field)
        checks = group.get("technical_checks")
        if not isinstance(checks, list) or not checks:
            errors.append(str(ident) + ": benannte technische Prüfungen fehlen.")
        matching = []
        for file_name in files:
            if any(fnmatch.fnmatchcase(file_name, pattern) for pattern in patterns):
                coverage[file_name].append(ident)
                matching.append(file_name)
        for pattern in patterns:
            if not any(fnmatch.fnmatchcase(filename, pattern) for filename in files):
                errors.append(str(ident) + ": Muster ohne Datei: " + pattern)
        summary.append({"id": ident, "title": group.get("title"), "files": len(matching),
                        "human_review_pending": True})
    for name, ids in coverage.items():
        if not ids:
            errors.append("Nicht zugeordnete Prüfdatei: " + name)
        elif len(ids) != 1:
            errors.append("Mehrfach zugeordnete Prüfdatei: " + name)
    return {"valid": not errors, "errors": errors,
            "assigned_files": sum(len(x) == 1 for x in coverage.values()),
            "total_files": len(files), "groups": summary,
            "human_review_complete": False}


def main():
    from check_c0_release import ARCHIVE_FILES, ROOT, VERSION_FILE
    version = json.loads((ROOT / VERSION_FILE).read_text(encoding="utf-8"))["version"]
    manifest = json.loads((ROOT / "release/review-segments.json").read_text(encoding="utf-8"))
    report = inspect_review_segments(manifest, ARCHIVE_FILES, version)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
