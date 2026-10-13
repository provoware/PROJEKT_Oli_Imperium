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
from validate_c64_capture import inspect_capture
from check_review_segments import inspect_review_segments

ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = "release/c0-version.json"
APPROVALS_FILE = "release/approvals.json"
SCOPE_FILE = "release/c0-scope.json"
ARCHIVE_FILES = (
    ".github/workflows/html-pilot.yml",
    ".github/workflows/validate.yml",
    "AGENTS.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "README.md",
    "data/contract.json",
    "data/original-session.template.json",
    "docs/03_UEBERGABE_A_B.md",
    "docs/05_TESTS_FORTSCHRITT.md",
    "docs/15_PILOT_01_BUERO_WELTKARTE.md",
    "docs/16_PILOT_01_UEBERGABE_A_B.md",
    "docs/18_REFERENZKANDIDAT_C64_PAL.md",
    "docs/19_HTML_TESTBASIS_REGELWERK.md",
    "docs/20_GEBUENDELTE_VORABNAHME.md",
    "docs/21_C0_ORIGINALVERGLEICH.md",
    "docs/22_C0_VORABNAHMEBOGEN.md",
    "docs/23_C0_REVIEW_SEGMENTIERUNG.md",
    "docs/24_C0_TECHNISCHER_UMFANG.md",
    "docs/25_C0_AUDIT_A_B_C_D.md",
    "docs/26_C0_UNABHAENGIGE_ABNAHMEVORLAGE.md",
    "docs/27_C0_ORIGINALPRUEFUNG_ANLEITUNG.md",
    "prototype/app.mjs",
    "prototype/contract-guard.mjs",
    "prototype/pilot-trace.mjs",
    "prototype/reference-comparison.mjs",
    "prototype/index.html",
    "prototype/navigation.mjs",
    "prototype/styles.css",
    "prototype/tests/navigation.test.mjs",
    "prototype/tests/contract-guard.test.mjs",
    "prototype/tests/pilot-trace.test.mjs",
    "prototype/tests/reference-comparison.test.mjs",
    "prototype/tests/accessibility.test.mjs",
    "prototype/tests/browser-regression.html",
    "prototype/tests/browser-regression.mjs",
    "prototype/tests/render.test.mjs",
    "prototype/ui/render.mjs",
    "prototype/ui/texts.de.mjs",
    "release/review-segments.json",
    SCOPE_FILE,
    "tools/check_c0_release.py",
    "tools/chrome_keyboard_probe.mjs",
    "tools/check_review_segments.py",
    "tools/validate_c64_capture.py",
    "tools/validate_project.py",
    "tests/test_c0_release.py",
    "tests/test_review_segments.py",
    "tests/test_validate_c64_capture.py",
    "tests/test_validate_project.py",
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

    # Der technische C0-Umfang ist nur für die Vorabnahme fixiert,
    # nicht fachlich freigegeben; alle implementierten Module sind erfasst.
    try:
        scope = load_json(root / SCOPE_FILE)
    except (OSError, ValueError) as exc:
        scope = {}
        errors.append("C0-Umfangsvertrag nicht lesbar: " + str(exc))
    if not isinstance(scope, dict):
        scope = {}
        errors.append("C0-Umfangsvertrag muss ein JSON-Objekt sein.")
    expected_paths = sorted(path for path in ARCHIVE_FILES
                            if path.startswith("prototype/") and
                            not path.startswith("prototype/tests/"))
    if (scope.get("schema_version") != 1
            or scope.get("component") != "c0-html-research-prototype"
            or scope.get("version") != version_name
            or scope.get("status") != "technical_feature_scope_frozen"
            or scope.get("purpose") != "INTERNAL_RESEARCH_PREVIEW_ONLY"
            or scope.get("frozen_implementation_paths") != expected_paths):
        errors.append("C0-Funktionsumfang fehlt, ist verändert oder passt nicht zum Dateikatalog.")
    # Nicht nur die fest vorgegebene ZIP-Liste prüfen: auch tatsächlich neu
    # angelegte Prototyp-Dateien auf dem Datenträger müssen auffallen.
    actual_paths = sorted(
        file.relative_to(root).as_posix()
        for file in (root / "prototype").rglob("*")
        if (file.is_file() or file.is_symlink())
        and file.relative_to(root / "prototype").parts[0] != "tests"
    )
    if actual_paths != expected_paths:
        errors.append("C0-Funktionsumfang: neue oder fehlende Prototyp-Datei außerhalb der Fixierung.")

    for label in ("features", "excluded_features", "allowed_post_freeze_changes"):
        items = scope.get(label)
        if (not isinstance(items, list) or not items
                or any(not isinstance(item, str) or not item for item in items)
                or len(items) != len(set(items))):
            errors.append("C0-Funktionsumfang: ungültige oder doppelte Einträge in " + label)
    for flag in ("new_gameplay_features_allowed", "historical_reference_verified",
                 "original_rules_approved", "manual_review_complete",
                 "public_release_allowed"):
        if scope.get(flag) is not False:
            errors.append("C0-Funktionsumfang darf keine automatische Freigabe erteilen: " + flag)

    # Vollständige, exakt einmal zugewiesene Prüfgruppen verhindern
    # unbemerkt wachsende, unprüfbare Vorabnahme-Pakete.
    try:
        segments = load_json(root / "release/review-segments.json")
    except (OSError, ValueError) as exc:
        segments = {}
        errors.append("Prüfgruppen nicht lesbar: " + str(exc))
    review_groups = inspect_review_segments(segments, ARCHIVE_FILES, version_name)
    errors.extend("Prüfgruppen: " + item for item in review_groups["errors"])

    # Die Originalvorlage darf keine echte Emulatorfreigabe vortäuschen.
    try:
        capture = load_json(root / "data/original-session.template.json")
        capture_status = inspect_capture(capture)
        if not capture_status["structure_valid"]:
            errors.extend("C64-Aufnahmevorlage: " + item for item in capture_status["errors"])
        if (capture_status["complete_for_independent_review"]
                or capture_status["scientifically_verified"]
                or capture_status["original_tests_approved"] != 0):
            errors.append("Original-Aufnahmevorlage darf keine Bestätigung enthalten.")
        # Auch teilweise echte Datenträgerbelege gehören ausschließlich
        # in private Forschungsakten, nicht ins öffentliche Prüfarchiv.
        if not isinstance(capture, dict):
            errors.append("Öffentliche Original-Aufnahmevorlage muss ein JSON-Objekt sein.")
        else:
            emulator = capture.get("emulator")
            disks = capture.get("original_files")
            test_observations = capture.get("test_observations")
            # Beschädigte Unterstrukturen dürfen weder unkontrolliert abstürzen
            # noch als vermeintlich unbenutzte öffentliche Vorlage gelten.
            if (capture.get("reference_status") != "not_recorded"
                    or capture.get("edition_description") is not None
                    or capture.get("legal_use_basis") is not None
                    or not isinstance(emulator, dict)
                    or emulator.get("version") is not None
                    or not isinstance(disks, list)
                    or any(not isinstance(disk, dict)
                           or disk.get("sha256") is not None
                           or disk.get("bytes") is not None for disk in disks)
                    or not isinstance(test_observations, list)
                    or any(not isinstance(test, dict)
                           or test.get("status") != "not_run"
                           or test.get("observed_navigation")
                           or test.get("screen_captures")
                           or test.get("description") is not None
                           for test in test_observations)):
                errors.append("Öffentliche Original-Aufnahmevorlage muss vollständig unbelegt bleiben.")
    except (OSError, ValueError) as exc:
        errors.append("C64-Aufnahmevorlage nicht lesbar: " + str(exc))

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
        "feature_scope_status": scope.get("status"),
        "review_groups": review_groups,
        "original_capture_template": "empty_unverified",
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
    # Technische Momentaufnahme als eigene überprüfte ZIP-Datei.
    # Keine übernommene Zustimmung, keine pauschale Originaltreue.
    files["REVIEW_STATUS.json"] = (json.dumps(
        report, ensure_ascii=False, indent=2, sort_keys=True,
    ) + "\n").encode("utf-8")
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
        if "REVIEW_STATUS.json" not in {item["path"] for item in manifest["files"]}:
            raise ValueError("Technischer Freigabestatus fehlt im Prüfmanifest.")
        status = json.loads(archive.read(prefix + "REVIEW_STATUS.json"))
        if (status.get("version") != manifest.get("version")
                or status.get("technical_structure_ok") is not True
                or status.get("public_release_allowed") is not False
                or status.get("manual_approval_complete") is not False
                or status.get("feature_scope_status") != "technical_feature_scope_frozen"
                or status.get("review_groups", {}).get("valid") is not True
                or len(status.get("review_groups", {}).get("groups", [])) != 4):
            raise ValueError("Das Archiv gibt einen falschen oder freigegebenen Prüfumfang an.")
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
