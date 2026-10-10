"""Negativ- und Positivtests der C64-Aufnahmeakte; synthetische Daten NUR IM TEST."""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from validate_c64_capture import TEMPLATE, inspect_capture, validate_capture  # noqa: E402


class C64CaptureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.template = json.loads(TEMPLATE.read_text(encoding="utf-8"))

    def clone(self):
        return copy.deepcopy(self.template)

    def completed_fixture(self):
        """Nur künstliche Testdaten. Keine echten Originalprogramme/Beobachtungen."""
        doc = self.clone()
        doc["reference_status"] = "captured"
        doc["edition_description"] = "SYNTHESE – ausdrücklich kein historischer Fund"
        doc["legal_use_basis"] = "TESTFALL, keine wirkliche Nutzungsberechtigung"
        doc["original_files"][0].update(sha256="a" * 64, bytes=100000)
        doc["original_files"][1].update(sha256="b" * 64, bytes=110000)
        doc["emulator"]["version"] = "SYNTHETISCH"
        for i, item in enumerate(doc["test_observations"], 1):
            item.update(
                status="recorded",
                description="Synthetische Testbeobachtung",
                screen_captures=[{"file_name": f"screen_{i}.png",
                                  "sha256": format(i, "064x"),
                                  "description": "Künstliches Bildschirmereignis"}],
                observed_navigation=[{"sequence": 1,
                                      "input_description": "Künstliche Joystickbewegung",
                                      "observed_screen_label": "Künstlicher Screen",
                                      "screen_id": f"SCREEN-00{i}",
                                      "capture_file": f"screen_{i}.png"}],
            )
        return doc

    def test_empty_template_is_valid_but_neither_verified_nor_ready(self):
        report = inspect_capture(self.clone())
        self.assertTrue(report["structure_valid"], report["errors"])
        self.assertFalse(report["complete_for_independent_review"])
        self.assertFalse(report["scientifically_verified"])
        self.assertEqual(report["original_tests_approved"], 0)
        self.assertIn("TEST-001: noch kein Originaltest aufgenommen", report["outstanding"])

    def test_complete_synthetic_fixture_is_only_ready_for_human_review(self):
        doc = self.completed_fixture()
        before = copy.deepcopy(doc)
        report = inspect_capture(doc)
        self.assertTrue(report["complete_for_independent_review"], report["errors"])
        self.assertFalse(report["scientifically_verified"])
        self.assertEqual(report["original_tests_approved"], 0)
        self.assertEqual(doc, before)

    def test_missing_hash_blocks_captured_status(self):
        doc = self.completed_fixture()
        doc["original_files"][0]["sha256"] = None
        self.assertFalse(inspect_capture(doc)["structure_valid"])

    def test_fake_original_pass_is_never_accepted(self):
        doc = self.completed_fixture()
        doc["test_observations"][0]["status"] = "passed"
        self.assertTrue(any("automatisch" in e for e in validate_capture(doc)[0]))

    def test_duplicate_and_missing_test_ids_are_rejected(self):
        doc = self.completed_fixture()
        doc["test_observations"][1]["test_id"] = "TEST-001"
        self.assertTrue(validate_capture(doc)[0])

    def test_hash_and_disk_format_must_match_candidate(self):
        doc = self.completed_fixture()
        doc["original_files"][1]["sha256"] = "broken"
        self.assertTrue(validate_capture(doc)[0])
        doc = self.completed_fixture()
        doc["original_files"][1]["sha256"] = "a" * 64
        self.assertTrue(validate_capture(doc)[0])
        doc = self.completed_fixture()
        doc["original_files"][0]["format"] = "d64"
        self.assertTrue(validate_capture(doc)[0])

    def test_emulator_version_is_not_auto_guessed(self):
        doc = self.completed_fixture()
        doc["emulator"]["version"] = None
        self.assertFalse(inspect_capture(doc)["structure_valid"])
        doc = self.completed_fixture()
        doc["emulator"]["video_standard"] = "NTSC"
        self.assertTrue(validate_capture(doc)[0])

    def test_screenshot_path_traversal_and_invalid_digest_are_rejected(self):
        doc = self.completed_fixture()
        doc["test_observations"][0]["screen_captures"][0]["file_name"] = "../fake.png"
        self.assertTrue(validate_capture(doc)[0])
        doc = self.completed_fixture()
        doc["test_observations"][0]["screen_captures"][0]["sha256"] = "0" * 63
        self.assertTrue(validate_capture(doc)[0])

    def test_step_links_and_numbering_must_be_consistent(self):
        doc = self.completed_fixture()
        doc["test_observations"][0]["observed_navigation"][0]["sequence"] = 7
        self.assertTrue(validate_capture(doc)[0])
        doc = self.completed_fixture()
        doc["test_observations"][0]["observed_navigation"][0]["capture_file"] = "missing.png"
        self.assertTrue(validate_capture(doc)[0])

    def test_not_run_does_not_accept_undocumented_observations(self):
        doc = self.completed_fixture()
        doc["reference_status"] = "not_recorded"
        doc["test_observations"][0]["status"] = "not_run"
        self.assertTrue(validate_capture(doc)[0])

    def test_unknown_schema_and_payload_types_are_rejected(self):
        doc = self.clone()
        doc["schema_version"] = 99
        self.assertTrue(validate_capture(doc)[0])
        self.assertTrue(validate_capture([])[0])
        self.assertTrue(validate_capture(None)[0])


if __name__ == "__main__":
    unittest.main()
