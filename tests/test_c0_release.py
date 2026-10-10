"""Tests für die technische C0-Vorabnahme, unabhängig von Originaltreue."""
import json
import shutil
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

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
        self.assertEqual(result["version"], "0.1.0-alpha.5")
        self.assertFalse(result["historical_reference_verified"])
        self.assertFalse(result["public_release_allowed"])
        self.assertFalse(result["manual_approval_complete"])

    def test_wrong_version_does_not_count_as_technical_success(self):
        self.modify_json("release/c0-version.json", lambda d: d.update(version="1.0.0"))
        result = inspect(self.root)
        self.assertFalse(result["technical_structure_ok"])
        self.assertTrue(any("Versionsvertrag" in error for error in result["errors"]))

    def test_unknown_approval_value_is_rejected(self):
        self.modify_json("release/approvals.json", lambda d: d.update(rights_review="gruen"))
        result = inspect(self.root)
        self.assertFalse(result["technical_structure_ok"])
        self.assertTrue(any("rights_review" in error for error in result["errors"]))

    def test_missing_required_file_stops_packaging(self):
        (self.root / "prototype/app.mjs").unlink()
        self.assertFalse(inspect(self.root)["technical_structure_ok"])
        with self.assertRaisesRegex(ValueError, "Prüfarchiv blockiert"):
            create_review_archive(self.root, self.root / "blocked.zip")

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
