#!/usr/bin/env python3
"""C0: reproduzierbares internes Prüfarchiv, KEIN öffentlicher Release-Gate-Bypass.

Nur Python-Standardbibliothek. Forschungsstatus und menschliche Freigaben
bleiben getrennt von automatisch feststellbarer technischer Struktur.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path

from validate_project import validate

ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = "release/c0-version.json"
APPROVALS_FILE = "release/approvals.json"
ARCHIVE_FILES = (
    ".github/workflows/html-pilot.yml",
    "AGENTS.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "README.md",
    "data/contract.json",
    "docs/19_HTML_TESTBASIS_REGELWERK.md",
    "docs/20_GEBUENDELTE_VORABNAHME.md",
    "prototype/app.mjs",
    "prototype/contract-guard.mjs",
    "prototype/index.html",
    "prototype/navigation.mjs",
    "prototype/styles.css",
    "prototype/tests/navigation.test.mjs",
    "prototype/tests/contract-guard.test.mjs",
    "prototype/tests/browser-regression.html",
    "prototype/tests/browser-regression.mjs",
    "prototype/tests/render.test.mjs",
    "prototype/ui/render.mjs",
    "prototype/ui/texts.de.mjs",
    VERSION_FILE,
    APPROVALS_FILE,
)
SEMVER = re.compile(r"^0\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)-(?:alpha|beta|rc)\.(?:0|[1-9]\d*)$")
APPROVAL_FIELDS = ("technical_review", "scientific_scope_review", "rights_review", "maintainer_approval")


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def inspect(root: Path = ROOT) -> dict:
    errors: list[str] = []
    for rel in ARCHIVE_FILES:
        path = root / rel
        if not path.is_file() or path.is_symlink():
            errors.append("Fehlende oder unzulässige Pflichtdatei: " + rel)
    try:
        version = load_json(root / VERSION_FILE)
    except (OSError, ValueError) as exc:
        version = {}
        errors.append("Versionsdatei unlesbar: " + str(exc))
    if not isinstance(version, dict):
        version = {}
        errors.append("Versionsdatei muss ein Objekt sein.")
    version_name = version.get("version")
    if (
        version.get("schema_version") != 1
        or version.get("component") != "c0-html-research-prototype"
        or version.get("channel") != "research-preview"
        or version.get("contract_schema") != "1.0"
        or version.get("release_policy") != "manual-approval-required"
        or not isinstance(version_name, str)
        or SEMVER.fullmatch(version_name) is None
    ):
        errors.append("C0-Versionsvertrag ungültig: erwartet eigenständiges SemVer-Vorabformat.")

    try:
        approvals = load_json(root / APPROVALS_FILE)
    except (OSError, ValueError) as exc:
        approvals = {}
        errors.append("Freigabedatei unlesbar: " + str(exc))
    if not isinstance(approvals, dict):
        approvals = {}
        errors.append("Freigabedatei muss ein Objekt sein.")
    if approvals.get("schema_version") != 1 or approvals.get("version") != version_name:
        errors.append("Freigabeformular besitzt eine unpassende Version.")
    for field in APPROVAL_FIELDS:
        if type(approvals.get(field)) is not bool:
            errors.append("Freigabefeld benötigt true/false: " + field)

    try:
        contract = load_json(root / "data/contract.json")
        if not isinstance(contract, dict):
            errors.append("Forschungsvertrag ist kein Objekt.")
            contract = {}
        errors.extend("Forschungsvertrag: " + item for item in validate(contract))
    except (OSError, ValueError) as exc:
        contract = {}
        errors.append("Forschungsvertrag unlesbar: " + str(exc))
    if contract.get("schema_version") != version.get("contract_schema"):
        errors.append("C0- und Forschungs-Schemaversion widersprechen sich.")

    reference = contract.get("reference", {})
    if not isinstance(reference, dict):
        reference = {}
    rules = contract.get("rules", [])
    tests = contract.get("tests", [])
    if not isinstance(rules, list):
        rules = []
    if not isinstance(tests, list):
        tests = []
    original_passed = sum(
        t.get("kind") == "original" and t.get("status") == "passed"
        for t in tests if isinstance(t, dict)
    )
    technical_structure_ok = not errors
    return {
        "component": "c0-html-research-prototype",
        "version": version_name,
        "technical_structure_ok": technical_structure_ok,
        "errors": errors,
        "historical_reference_verified": reference.get("status") == "verified" and reference.get("verified_run") is True,
        "approved_rules": sum(r.get("status") == "approved" for r in rules if isinstance(r, dict)),
        "passed_original_tests": original_passed,
        "approvals": {field: approvals.get(field) for field in APPROVAL_FIELDS},
        "manual_approval_complete": all(approvals.get(field) is True for field in APPROVAL_FIELDS),
        "browser_visual_review": "nicht automatisiert bestätigt",
        "public_release_allowed": False,
        "note": "Prüfarchiv nur für interne Vorabnahme; CI, Rechte und fachliche Reviews zusätzlich extern prüfen.",
    }


def archive_members(root: Path) -> dict[str, bytes]:
    return {rel: (root / rel).read_bytes() for rel in ARCHIVE_FILES}


def create_review_archive(root: Path, destination: Path) -> dict:
    report = inspect(root)
    if not report["technical_structure_ok"]:
        raise ValueError("Prüfarchiv blockiert: " + "; ".join(report["errors"]))
    files = archive_members(root)
    manifest = {
        "schema_version": 1,
        "version": report["version"],
        "purpose": "INTERNAL_TECHNICAL_REVIEW_ONLY",
        "original_verified": report["historical_reference_verified"],
        "files": [
            {"path": name, "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload)}
            for name, payload in sorted(files.items())
        ],
    }
    files["REVIEW_MANIFEST.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    prefix = "oli-imperium-c0-" + report["version"] + "/"
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for name, payload in sorted(files.items()):
            info = zipfile.ZipInfo(prefix + name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            output.writestr(info, payload, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return report


def verify_review_archive(path: Path) -> None:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Doppelte Archivpfade.")
        manifest_paths = [name for name in names if name.endswith("/REVIEW_MANIFEST.json")]
        if len(manifest_paths) != 1:
            raise ValueError("Prüfmanifest fehlt oder ist doppelt.")
        manifest_path = manifest_paths[0]
        prefix = manifest_path.removesuffix("REVIEW_MANIFEST.json")
        manifest = json.loads(archive.read(manifest_path))
        if manifest.get("purpose") != "INTERNAL_TECHNICAL_REVIEW_ONLY":
            raise ValueError("Das Archiv ist kein internes Prüfarchiv.")
        expected = {prefix + entry["path"] for entry in manifest["files"]} | {manifest_path}
        if set(names) != expected:
            raise ValueError("Archivinhalt stimmt nicht mit dem Manifest überein.")
        if any("/../" in name or name.startswith("/") or "\\" in name for name in names):
            raise ValueError("Unsichere Archivpfade.")
        for item in manifest["files"]:
            content = archive.read(prefix + item["path"])
            if len(content) != item["bytes"] or hashlib.sha256(content).hexdigest() != item["sha256"]:
                raise ValueError("Beschädigte Datei: " + item["path"])


def main() -> int:
    parser = argparse.ArgumentParser(description="C0-Vorabnahme: Strukturprüfung und internes ZIP-Paket")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--package", type=Path, help="Deterministisches INTERNES Prüfarchiv erzeugen")
    group.add_argument("--verify", type=Path, help="ZIP gegen Inhaltsmanifest prüfen")
    args = parser.parse_args()
    try:
        if args.verify:
            verify_review_archive(args.verify)
            print("Prüfarchiv: Inhalte und SHA-256-Werte stimmen überein.")
            return 0
        report = create_review_archive(ROOT, args.package) if args.package else inspect(ROOT)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report["technical_structure_ok"] else 1
    except (OSError, ValueError, zipfile.BadZipFile, KeyError, TypeError) as exc:
        print("C0-Prüfung fehlgeschlagen: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
