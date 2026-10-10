"""Regressionsfälle: jede Prüfdatei einer und nur einer PR-Teilabnahme."""
import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from check_c0_release import ARCHIVE_FILES  # noqa: E402
from check_review_segments import inspect_review_segments  # noqa: E402

VERSION = json.loads((ROOT / "release/c0-version.json").read_text(encoding="utf-8"))["version"]
SEGMENTS = json.loads((ROOT / "release/review-segments.json").read_text(encoding="utf-8"))


class ReviewSegmentsTests(unittest.TestCase):
    def test_every_review_file_has_exactly_one_group(self):
        report = inspect_review_segments(SEGMENTS, ARCHIVE_FILES, VERSION)
        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["assigned_files"], report["total_files"])
        self.assertEqual([group["id"] for group in report["groups"]], list("ABCD"))
        self.assertTrue(all(group["files"] > 0 and group["human_review_pending"] for group in report["groups"]))
        self.assertFalse(report["human_review_complete"])

    def test_new_source_without_a_group_blocks_review_bundle(self):
        report = inspect_review_segments(SEGMENTS, (*ARCHIVE_FILES, "unmapped/new_game_logic.py"), VERSION)
        self.assertFalse(report["valid"])
        self.assertTrue(any("Nicht zugeordnete" in error for error in report["errors"]))

    def test_pattern_overlap_blocks_review_bundle(self):
        copy_data = copy.deepcopy(SEGMENTS)
        copy_data["groups"][0]["patterns"].append("prototype/**")
        report = inspect_review_segments(copy_data, ARCHIVE_FILES, VERSION)
        self.assertFalse(report["valid"])
        self.assertTrue(any("Mehrfach" in error for error in report["errors"]))

    def test_missing_and_duplicate_file_block_review_bundle(self):
        self.assertFalse(inspect_review_segments(SEGMENTS, tuple(path for path in ARCHIVE_FILES if path != "README.md"), VERSION)["valid"])
        self.assertFalse(inspect_review_segments(SEGMENTS, (*ARCHIVE_FILES, ARCHIVE_FILES[0]), VERSION)["valid"])

    def test_incorrect_version_and_fake_approval_are_rejected(self):
        self.assertFalse(inspect_review_segments(SEGMENTS, ARCHIVE_FILES, "0.1.0-beta.1")["valid"])
        fake = copy.deepcopy(SEGMENTS)
        fake["overall_approval"] = "approved"
        self.assertFalse(inspect_review_segments(fake, ARCHIVE_FILES, VERSION)["valid"])

    def test_unknown_review_group_or_broad_pattern_is_rejected(self):
        fake = copy.deepcopy(SEGMENTS)
        fake["groups"][2]["id"] = "E"
        self.assertFalse(inspect_review_segments(fake, ARCHIVE_FILES, VERSION)["valid"])
        fake = copy.deepcopy(SEGMENTS)
        fake["groups"][1]["patterns"] = ["*"]
        self.assertFalse(inspect_review_segments(fake, ARCHIVE_FILES, VERSION)["valid"])


if __name__ == "__main__":
    unittest.main()
