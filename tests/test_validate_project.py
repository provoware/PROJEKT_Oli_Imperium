import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from validate_project import progress, validate

def base():
    return {
        "schema_version": "1.0",
        "reference": {"status": "not_selected", "platform": "C64", "region": "DE-PAL",
                      "image_sha256": None, "emulator_version": None, "verified_run": False},
        "sources": [], "rules": [], "screens": [], "modules": [], "tests": [], "questions": []
    }

class TestContract(unittest.TestCase):
    def test_empty_contract_is_valid_but_not_full_progress(self):
        d = base()
        self.assertEqual(validate(d), [])
        self.assertTrue(all(v == "nicht messbar" for v in progress(d).values()))

    def test_detect_duplicate_id(self):
        d = base()
        d["rules"] = [{"id": "REGEL-1", "title": "Test", "status": "open"},
                      {"id": "REGEL-1", "title": "Test", "status": "open"}]
        self.assertTrue(any("Doppelte ID" in e for e in validate(d)))

    def test_detect_dangling_source(self):
        d = base()
        d["rules"] = [{"id": "REGEL-1", "title": "Test", "status": "open", "source_ids": ["SRC-X"]}]
        self.assertTrue(any("fehlende ID" in e for e in validate(d)))

    def test_forbid_passed_original_without_reference(self):
        d = base()
        d["tests"] = [{"id": "TEST-1", "title": "Probe", "kind": "original",
                       "mandatory": True, "weight": 5, "status": "passed",
                       "evidence": "bild.png"}]
        self.assertTrue(any("verifizierte Referenz" in e for e in validate(d)))

    def test_weighted_progress_counts_unrun(self):
        d = base()
        d["reference"].update({"status": "verified", "verified_run": True,
                                "image_sha256": "a" * 64, "emulator_version": "VICE-Test"})
        d["tests"] = [
            {"id": "TEST-1", "title": "Eins", "kind": "original", "mandatory": True,
             "weight": 3, "status": "passed", "evidence": "Versuch-1"},
            {"id": "TEST-2", "title": "Zwei", "kind": "original", "mandatory": True,
             "weight": 1, "status": "not_run"}
        ]
        self.assertEqual(validate(d), [])
        self.assertEqual(progress(d)["Bestätigte gewichtete Originaltreue"], "75.0% (3/4)")

    def test_bad_reference_hash(self):
        d = base()
        d["reference"].update({"status": "verified", "verified_run": True,
                               "image_sha256": "123", "emulator_version": "VICE"})
        self.assertTrue(any("SHA-256" in e for e in validate(d)))

if __name__ == "__main__":
    unittest.main()
