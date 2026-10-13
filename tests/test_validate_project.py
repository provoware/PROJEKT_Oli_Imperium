import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from validate_project import main, progress, validate

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
        d["sources"] = [{"id": "SRC-1", "title": "Versuch", "type": "emulator", "url": "https://example.org/test"}]
        d["rules"] = [{"id": "REGEL-1", "title": "Getestete Regel", "status": "approved", "source_ids": ["SRC-1"], "screen_ids": []}]
        d["tests"] = [
            {"id": "TEST-1", "title": "Eins", "kind": "original", "mandatory": True,
             "weight": 3, "status": "passed", "evidence": "Versuch-1", "rule_ids": ["REGEL-1"]},
            {"id": "TEST-2", "title": "Zwei", "kind": "original", "mandatory": True,
             "weight": 1, "status": "not_run", "rule_ids": ["REGEL-1"]}
        ]
        self.assertEqual(validate(d), [])
        self.assertEqual(progress(d)["Bestätigte gewichtete Originaltreue"], "75.0% (3/4)")

    def test_unexpected_nested_json_types_report_errors_instead_of_crashing(self):
        cases = (
            ("Referenzstatus", "reference", {"status": []}),
            ("Regelstatus", "rules", {"id": "REGEL-X", "title": "Test", "status": []}),
            ("Quellentyp", "sources", {"id": "SRC-X", "title": "Test", "type": [],
                                       "url": "https://example.org"}),
            ("Testart", "tests", {"id": "TEST-X", "title": "Test", "kind": [],
                                  "status": "not_run", "mandatory": True, "weight": 1}),
            ("Fragenzuständigkeit", "questions",
             {"id": "Q-X", "text": "Test", "status": "open", "owner": []}),
        )
        for label, group, row in cases:
            with self.subTest(label=label):
                contract = base()
                if group == "reference":
                    contract[group].update(row)
                else:
                    contract[group].append(row)
                self.assertTrue(validate(contract), label)

    def test_reference_claims_require_strict_boolean_and_matching_status(self):
        for status, run, expected in (
            ("candidate", True, "widersprechen"),
            ("not_selected", True, "widersprechen"),
            ("verified", 1, "true/false"),
            ("verified", "yes", "true/false"),
            ("verified", False, "Emulatorstart"),
            ("candidate", None, "true/false"),
        ):
            with self.subTest(status=status, run=run):
                d = base()
                d["reference"].update(status=status, verified_run=run)
                if status == "verified":
                    d["reference"].update(image_sha256="a" * 64,
                                          emulator_version="VICE-Test")
                self.assertTrue(any(expected in error for error in validate(d)),
                                f"{status}: {run}")

    def test_cli_rejects_invalid_json_structure_without_progress_or_traceback(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "contract.json"
            for mutate in (
                lambda d: d.update(rules=[None]),
                lambda d: d.update(tests={"TEST-001": "not_run"}),
                lambda d: d["reference"].update(status=[]),
                lambda d: d.update(tests=[
                    {"id": "TEST-001", "title": "Fehler", "kind": "original",
                     "status": "failed", "mandatory": True, "weight": []}]),
            ):
                with self.subTest(mutate=repr(mutate)):
                    d = base()
                    mutate(d)
                    path.write_text(json.dumps(d), encoding="utf-8")
                    out, err = StringIO(), StringIO()
                    with redirect_stdout(out), redirect_stderr(err):
                        result = main(path)
                    self.assertEqual(result, 1, err.getvalue())
                    self.assertIn("FEHLER", err.getvalue())
                    self.assertNotIn("Fortschritt:", out.getvalue())
                    self.assertNotIn("A-Regeln:", out.getvalue())

    def test_browser_and_python_enforce_same_mandatory_reference_lists(self):
        for group, row, missing_field in (
            ("rules", {"id": "REGEL-X", "title": "Test", "status": "open",
                       "source_ids": [], "screen_ids": []}, "source_ids"),
            ("rules", {"id": "REGEL-X", "title": "Test", "status": "open",
                       "source_ids": [], "screen_ids": []}, "screen_ids"),
            ("screens", {"id": "SCREEN-001", "title": "Test", "status": "open",
                         "source_ids": []}, "source_ids"),
            ("questions", {"id": "Q-001", "text": "Test", "status": "open",
                           "owner": "A", "related_ids": []}, "related_ids"),
        ):
            for invalid in ("missing", None, {}):
                with self.subTest(group=group, field=missing_field, invalid=invalid):
                    d = base()
                    value = dict(row)
                    if invalid == "missing":
                        value.pop(missing_field)
                    else:
                        value[missing_field] = invalid
                    d[group] = [value]
                    self.assertTrue(any(missing_field in error for error in validate(d)))
            d = base()
            d[group] = [dict(row)]
            self.assertEqual(validate(d), [])

    def test_approved_rule_needs_source(self):
        d = base()
        d["rules"] = [{"id": "REGEL-1", "title": "Ohne Quelle", "status": "approved"}]
        self.assertTrue(any("benötigt source_ids" in e for e in validate(d)))

    def test_passed_original_needs_rule_link(self):
        d = base()
        d["reference"].update({"status": "verified", "verified_run": True,
                               "image_sha256": "a" * 64, "emulator_version": "VICE-Test"})
        d["tests"] = [{"id": "TEST-1", "title": "Ohne Regel", "kind": "original",
                       "mandatory": True, "weight": 1, "status": "passed",
                       "evidence": "Versuch-1"}]
        self.assertTrue(any("verknüpfte rule_ids" in e for e in validate(d)))

    def test_bad_reference_hash(self):
        d = base()
        d["reference"].update({"status": "verified", "verified_run": True,
                               "image_sha256": "123", "emulator_version": "VICE"})
        self.assertTrue(any("SHA-256" in e for e in validate(d)))

if __name__ == "__main__":
    unittest.main()
