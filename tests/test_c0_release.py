"""Tests für die technische C0-Vorabnahme, unabhängig von Originaltreue."""
import json
import shutil
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from html.parser import HTMLParser
from posixpath import normpath, join
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from check_c0_release import (  # noqa: E402
    ARCHIVE_FILES, ROOT, create_review_archive, inspect, verify_review_archive,
)


class TestC0ReviewGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ARCHIVE_FILES:
            destination = self.root / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, destination)

    def modify_json(self, name, callback):
        path = self.root / name
        data = json.loads(path.read_text(encoding="utf-8"))
        callback(data)
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    def test_contract_is_valid_but_never_authorizes_public_release(self):
        result = inspect(self.root)
        self.assertTrue(result["technical_structure_ok"], result["errors"])
        self.assertEqual(result["version"], "0.1.0-alpha.8")
        self.assertFalse(result["historical_reference_verified"])
        self.assertFalse(result["public_release_allowed"])
        self.assertFalse(result["manual_approval_complete"])

    def test_wrong_version_does_not_count_as_technical_success(self):
        self.modify_json("release/c0-version.json", lambda d: d.update(version="1.0.0"))
        result = inspect(self.root)
        self.assertFalse(result["technical_structure_ok"])
        self.assertTrue(any("Versionsvertrag" in error for error in result["errors"]))

    def test_scope_is_frozen_but_never_grants_public_or_scientific_release(self):
        report = inspect(self.root)
        self.assertTrue(report["technical_structure_ok"], report["errors"])
        self.assertEqual(report["feature_scope_status"], "technical_feature_scope_frozen")
        scope = json.loads((self.root / "release/c0-scope.json").read_text(encoding="utf-8"))
        self.assertFalse(scope["new_gameplay_features_allowed"])
        self.assertFalse(scope["historical_reference_verified"])
        self.assertFalse(scope["original_rules_approved"])
        self.assertFalse(scope["manual_review_complete"])
        self.assertFalse(scope["public_release_allowed"])

    def test_scope_cannot_hide_new_implementation_module(self):
        self.modify_json("release/c0-scope.json",
                         lambda data: data["frozen_implementation_paths"].pop())
        report = inspect(self.root)
        self.assertFalse(report["technical_structure_ok"])
        self.assertTrue(any("Funktionsumfang" in e for e in report["errors"]))

    def test_scope_cannot_claim_a_release_or_changed_version(self):
        for flag in ("public_release_allowed", "historical_reference_verified",
                     "new_gameplay_features_allowed"):
            with self.subTest(flag=flag):
                self.modify_json("release/c0-scope.json",
                                 lambda data, key=flag: data.update({key: True}))
                report = inspect(self.root)
                self.assertFalse(report["technical_structure_ok"])
                self.assertTrue(any(key in e for e in report["errors"]))
                self.modify_json("release/c0-scope.json",
                                 lambda data, key=flag: data.update({key: False}))
        self.modify_json("release/c0-scope.json",
                         lambda data: data.update(version="0.1.0-alpha.7"))
        self.assertFalse(inspect(self.root)["technical_structure_ok"])

    def test_unknown_approval_value_is_rejected(self):
        self.modify_json("release/approvals.json", lambda d: d.update(rights_review="gruen"))
        result = inspect(self.root)
        self.assertFalse(result["technical_structure_ok"])
        self.assertTrue(any("rights_review" in error for error in result["errors"]))

    def test_partially_filled_original_template_is_never_published(self):
        self.modify_json("data/original-session.template.json",
                         lambda d: d["original_files"][0].update(sha256="a" * 64))
        report = inspect(self.root)
        self.assertFalse(report["technical_structure_ok"])
        self.assertTrue(any("vollständig unbelegt" in item for item in report["errors"]))

    def test_malformed_original_capture_template_fails_with_report(self):
        (self.root / "data/original-session.template.json").write_text(
            "[]", encoding="utf-8",
        )
        report = inspect(self.root)
        self.assertFalse(report["technical_structure_ok"])
        self.assertTrue(report["errors"])

    def test_missing_required_file_stops_packaging(self):
        (self.root / "prototype/app.mjs").unlink()
        self.assertFalse(inspect(self.root)["technical_structure_ok"])
        with self.assertRaisesRegex(ValueError, "Prüfarchiv blockiert"):
            create_review_archive(self.root, self.root / "blocked.zip")

    def test_standalone_preview_includes_each_local_html_link(self):
        class Links(HTMLParser):
            def __init__(self):
                super().__init__()
                self.urls = []

            def handle_starttag(self, tag, attrs):
                if tag in ("a", "script", "link"):
                    data = dict(attrs)
                    target = data.get("href") or data.get("src")
                    if target:
                        self.urls.append(target)

        parser = Links()
        parser.feed((self.root / "prototype/index.html").read_text(encoding="utf-8"))
        local_count = 0
        for url in parser.urls:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            destination = normpath(join("prototype", parsed.path))
            self.assertIn(destination, ARCHIVE_FILES,
                          "Lokaler HTML-Verweis fehlt im eigenständigen Prüf-ZIP: " + destination)
            local_count += 1
        self.assertGreaterEqual(local_count, 4)

    def test_archive_is_reproducible_and_integrity_verified(self):
        first = self.root / "first.zip"
        second = self.root / "second.zip"
        create_review_archive(self.root, first)
        create_review_archive(self.root, second)
        self.assertEqual(first.read_bytes(), second.read_bytes())
        verify_review_archive(first)
        with zipfile.ZipFile(first) as zipped:
            files = zipped.namelist()
        self.assertFalse(any(name.endswith(".g64") or name.endswith(".d64") for name in files))
        self.assertTrue(any(name.endswith("REVIEW_MANIFEST.json") for name in files))

    def test_review_status_is_bundled_and_requires_all_four_open_approvals(self):
        archive_path = self.root / "status.zip"
        create_review_archive(self.root, archive_path)
        with zipfile.ZipFile(archive_path) as archive:
            status_name = next(item for item in archive.namelist()
                               if item.endswith("/REVIEW_STATUS.json"))
            status = json.loads(archive.read(status_name))
        self.assertTrue(status["technical_structure_ok"])
        self.assertFalse(status["public_release_allowed"])
        self.assertFalse(status["manual_approval_complete"])
        self.assertEqual(len(status["approvals"]), 4)
        self.assertTrue(all(value is False for value in status["approvals"].values()))

    def test_fake_approval_in_review_status_is_rejected(self):
        source = self.root / "review-source.zip"
        forged = self.root / "review-forged.zip"
        create_review_archive(self.root, source)
        with zipfile.ZipFile(source) as archive, zipfile.ZipFile(forged, "w") as destination:
            for name in archive.namelist():
                payload = archive.read(name)
                if name.endswith("/REVIEW_STATUS.json"):
                    status = json.loads(payload)
                    status["public_release_allowed"] = True
                    payload = json.dumps(status).encode("utf-8")
                destination.writestr(name, payload)
        with self.assertRaisesRegex(ValueError, "falschen|Beschädigte"):
            verify_review_archive(forged)

    def test_changed_archive_entry_is_detected(self):
        original = self.root / "valid.zip"
        altered = self.root / "altered.zip"
        create_review_archive(self.root, original)
        with zipfile.ZipFile(original) as source, zipfile.ZipFile(altered, "w") as target:
            for name in source.namelist():
                payload = source.read(name)
                if name.endswith("/prototype/index.html"):
                    payload += b"tampered"
                target.writestr(name, payload)
        with self.assertRaisesRegex(ValueError, "Beschädigte Datei"):
            verify_review_archive(altered)

    def test_scientific_status_is_not_inferred_from_green_structure(self):
        self.modify_json("release/approvals.json", lambda d: d.update(
            technical_review=True, scientific_scope_review=True,
            rights_review=True, maintainer_approval=True,
        ))
        result = inspect(self.root)
        self.assertTrue(result["technical_structure_ok"])
        self.assertTrue(result["manual_approval_complete"])
        self.assertFalse(result["public_release_allowed"])
        self.assertFalse(result["historical_reference_verified"])


if __name__ == "__main__":
    unittest.main()
