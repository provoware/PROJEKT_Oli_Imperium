#!/usr/bin/env python3
"""Kleiner, ausschließlich struktureller Projektvertrag-Prüfer (Python-Standardbibliothek)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KINDS = {
    "sources": "SRC", "rules": "REGEL", "screens": "SCREEN",
    "modules": "MOD", "tests": "TEST", "questions": "Q"
}
STATUSES = {
    "rules": {"open", "manual", "observed", "approved"},
    "screens": {"open", "captured", "reviewed"},
    "modules": {"planned", "designed", "approved"},
    "tests": {"not_run", "passed", "failed", "blocked"},
    "questions": {"open", "answered", "closed"},
}
SOURCE_TYPES = {"primary", "emulator", "secondary", "forum", "reconstruction"}
TEST_KINDS = {"original", "structure", "integration"}

def validate(data: dict) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["Wurzel muss ein JSON-Objekt sein."]
    if data.get("schema_version") != "1.0":
        errors.append("schema_version muss '1.0' sein.")
    ref = data.get("reference")
    if not isinstance(ref, dict):
        errors.append("reference fehlt oder ist kein Objekt.")
        ref = {}
    reference_status = ref.get("status")
    if not isinstance(reference_status, str) or reference_status not in {"not_selected", "candidate", "verified"}:
        errors.append("reference.status ungültig.")
    verified_run = ref.get("verified_run")
    if type(verified_run) is not bool:
        errors.append("reference.verified_run muss true/false sein.")
    if reference_status == "verified":
        if verified_run is not True or not is_sha256(ref.get("image_sha256")):
            errors.append("Verifizierte Referenz benötigt Emulatorstart und 64-stelligen SHA-256.")
        if not isinstance(ref.get("emulator_version"), str) or not ref["emulator_version"].strip():
            errors.append("Verifizierte Referenz benötigt emulator_version.")
    elif verified_run is True:
        errors.append("Emulatorlauf und ungeprüfter Referenzstatus widersprechen sich.")
    seen: dict[str, str] = {}
    groups = {}
    for kind, prefix in KINDS.items():
        items = data.get(kind)
        if not isinstance(items, list):
            errors.append(f"{kind}: erwartet Liste.")
            items = []
        groups[kind] = items
        for pos, item in enumerate(items):
            label = f"{kind}[{pos}]"
            if not isinstance(item, dict):
                errors.append(f"{label}: erwartet Objekt.")
                continue
            ident = item.get("id")
            if not isinstance(ident, str) or not ident.startswith(prefix + "-") or len(ident) <= len(prefix)+1:
                errors.append(f"{label}: ID muss mit {prefix}- beginnen.")
                continue
            if ident in seen:
                errors.append(f"Doppelte ID: {ident} (in {seen[ident]} und {kind}).")
            seen[ident] = kind
            if not isinstance(item.get("title", item.get("text")), str) or not (item.get("title") or item.get("text")):
                errors.append(f"{ident}: title/text fehlt.")
            if kind in STATUSES and (not isinstance(item.get("status"), str) or item["status"] not in STATUSES[kind]):
                errors.append(f"{ident}: unbekannter Status.")
            if kind == "rules" and item.get("status") == "approved" and not item.get("source_ids"):
                errors.append(f"{ident}: freigegebene Regel benötigt source_ids.")
            if kind == "sources":
                if not isinstance(item.get("type"), str) or item["type"] not in SOURCE_TYPES: errors.append(f"{ident}: unzulässiger Quellentyp.")
                if not isinstance(item.get("url"), str) or not item["url"].startswith("https://"):
                    errors.append(f"{ident}: https-URL erforderlich.")
            if kind == "tests":
                if not isinstance(item.get("kind"), str) or item["kind"] not in TEST_KINDS: errors.append(f"{ident}: unbekannte Testart.")
                if not isinstance(item.get("mandatory"), bool): errors.append(f"{ident}: mandatory muss boolesch sein.")
                if type(item.get("weight")) is not int or item["weight"] < 1: errors.append(f"{ident}: weight muss positive Ganzzahl sein.")
                if item.get("kind") == "original" and item.get("status") == "passed":
                    if ref.get("status") != "verified":
                        errors.append(f"{ident}: Originaltest kann ohne verifizierte Referenz nicht bestanden sein.")
                    if not item.get("evidence"): errors.append(f"{ident}: bestandener Originaltest benötigt evidence.")
                    if not item.get("rule_ids"):
                        errors.append(f"{ident}: bestandener Originaltest benötigt verknüpfte rule_ids.")
            if kind == "questions" and item.get("owner") not in ("A", "B"):
                errors.append(f"{ident}: owner muss A oder B sein.")
    expected_refs = {
        "rules": {"source_ids": "sources", "screen_ids": "screens"},
        "screens": {"source_ids": "sources"},
        "modules": {"rule_ids": "rules"},
        "tests": {"rule_ids": "rules"},
        "questions": {"related_ids": None, "blocks": None}
    }
    for kind, link_fields in expected_refs.items():
        for item in groups[kind]:
            if not isinstance(item, dict) or not isinstance(item.get("id"), str): continue
            for field, target in link_fields.items():
                links = item.get(field, [])
                if not isinstance(links, list):
                    errors.append(f"{item['id']}.{field}: erwartet Liste.")
                    continue
                if len(links) != len(set(str(v) for v in links)):
                    errors.append(f"{item['id']}.{field}: doppelte Verknüpfung.")
                for value in links:
                    if not isinstance(value, str) or value not in seen:
                        errors.append(f"{item['id']}.{field}: fehlende ID {value!r}.")
                    elif target is not None and seen[value] != target:
                        errors.append(f"{item['id']}.{field}: {value} gehört nicht zu {target}.")
    return errors

def is_sha256(value: object) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(c in "0123456789abcdefABCDEF" for c in value)

def progress(data: dict) -> dict[str, str]:
    def percent(done: int, total: int) -> str:
        return "nicht messbar" if total == 0 else f"{(100 * done / total):.1f}% ({done}/{total})"
    rules = data.get("rules", [])
    modules = data.get("modules", [])
    required = [t for t in data.get("tests", []) if t.get("mandatory") and t.get("kind") == "original"]
    tested = [t for t in required if t.get("status") in {"passed", "failed"}]
    passed = [t for t in required if t.get("status") == "passed"]
    w = lambda a: sum(t.get("weight", 1) for t in a)
    return {
        "A-Regeln": percent(sum(r.get("status") == "approved" for r in rules), len(rules)),
        "B-Module": percent(sum(m.get("status") == "approved" for m in modules), len(modules)),
        "Originalprüfabdeckung": percent(len(tested), len(required)),
        "Originalprüfübereinstimmung": percent(len(passed), len(tested)),
        "Bestätigte gewichtete Originaltreue": percent(w(passed), w(required)),
    }

def main(path: Path) -> int:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"FEHLER beim Einlesen: {exc}", file=sys.stderr)
        return 2
    errors = validate(data)
    print("PROJEKT_Oli_Imperium | Datenvertrag und Fortschritt")
    # Ein ungültiger Vertrag darf weder abstürzende noch irreführende
    # Fortschrittszahlen erzeugen. Erst prüfen, dann Fortschritt berechnen.
    if errors:
        for error in errors:
            print(f"FEHLER: {error}", file=sys.stderr)
        return 1
    for key, value in progress(data).items():
        print(f"  {key}: {value}")
    print("Strukturprüfung: OK (keine Bestätigung historischer Fakten)")
    return 0

if __name__ == "__main__":
    supplied = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "contract.json"
    raise SystemExit(main(supplied))
