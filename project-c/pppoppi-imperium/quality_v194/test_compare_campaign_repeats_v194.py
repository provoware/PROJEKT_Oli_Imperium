"""Regression checks for two-run browser campaign comparison."""
import json
import math
import tempfile
import unittest
from pathlib import Path

from compare_campaign_repeats_v194 import compare, read_campaign_log


def sample(months=120):
    return {
        "months": months, "viewport": "800x600", "keyboard": "Enter",
        "human_turns": months * 4, "chromium_processes": 3,
        "release_gate": "BLOCKED", "performance_release_gate": "BLOCKED: no agreed threshold",
        "retained_reports": min(months, 120), "natural_rescues": 2,
        "end_to_end_seconds": 110.0,
        "month_step_profile": {
            "measured_months": months, "month_steps_total_seconds": 100.0,
            "month_step_median_seconds": 0.7, "month_step_p95_seconds": 1.3,
            "month_step_p99_seconds": 1.5, "month_step_max_seconds": 2.0,
            "second_half_vs_first_half_ratio": 1.2,
        },
        "state_size_profile": {"sampled_months": months, "month_to_month_change_pearson_r": -0.2},
    }


class CampaignRepeatTests(unittest.TestCase):
    def test_equal_runs_never_claim_release_pass(self):
        result = compare(sample(), sample(), 120)
        self.assertEqual(result["metrics"]["end_to_end_seconds"]["run_2_vs_run_1_percent"], 0)
        self.assertTrue(result["release_gate"].startswith("BLOCKED"))

    def test_observed_variation_is_descriptive(self):
        second = sample()
        second["end_to_end_seconds"] = 121
        second["month_step_profile"]["month_step_p95_seconds"] = 1.56
        result = compare(sample(), second, 120)
        self.assertEqual(result["metrics"]["end_to_end_seconds"]["run_2_vs_run_1_percent"], 10)
        self.assertEqual(result["metrics"]["month_step_profile.month_step_p95_seconds"]["run_2_vs_run_1_percent"], 20)

    def test_rejects_incomplete_and_wrong_configuration(self):
        for key, value in (("months", 240), ("viewport", "1024x768"), ("keyboard", "mouse"),
                           ("human_turns", 1), ("retained_reports", 0), ("chromium_processes", 1),
                           ("release_gate", "PASS")):
            with self.subTest(key=key):
                bad = sample()
                bad[key] = value
                with self.assertRaises(ValueError):
                    compare(sample(), bad, 120)

    def test_rejects_invalid_measurements_and_series(self):
        for field, value in (("month_step_p95_seconds", math.nan), ("month_step_max_seconds", -1),
                             ("measured_months", 119)):
            with self.subTest(field=field):
                bad = sample()
                bad["month_step_profile"][field] = value
                with self.assertRaises(ValueError):
                    compare(bad, sample(), 120)
        bad = sample()
        bad["month_step_profile"]["month_steps_total_seconds"] = 120
        with self.assertRaises(ValueError):
            compare(bad, sample(), 120)

    def test_rejects_invalid_correlation_and_zero_baseline(self):
        for value in (math.nan, 1.5):
            bad = sample()
            bad["state_size_profile"]["month_to_month_change_pearson_r"] = value
            with self.assertRaises(ValueError):
                compare(sample(), bad, 120)
        bad = sample()
        bad["month_step_profile"]["month_step_p99_seconds"] = 0
        with self.assertRaises(ValueError):
            compare(bad, sample(), 120)

    def test_240_month_repeat_requires_120_report_window(self):
        first, second = sample(240), sample(240)
        second["end_to_end_seconds"] = 121.0
        result = compare(first, second, 240)
        self.assertEqual(result["months_per_run"], 240)
        self.assertEqual(result["human_turns_per_run"], 960)
        self.assertEqual(result["runs"], 2)
        self.assertTrue(result["release_gate"].startswith("BLOCKED"))
        second["retained_reports"] = 240
        with self.assertRaises(ValueError):
            compare(first, second, 240)

    def test_240_month_repeat_rejects_120_month_record(self):
        with self.assertRaises(ValueError):
            compare(sample(240), sample(120), 240)
        with self.assertRaises(ValueError):
            compare(sample(120), sample(240), 240)

    def test_log_reader_rejects_missing_or_duplicate_summary(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "run.log"
            path.write_text("PASS: month 120\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                read_campaign_log(path)
            line = "BROWSER-LANGKAMPAGNE: " + json.dumps(sample()) + "\n"
            path.write_text(line, encoding="utf-8")
            self.assertEqual(read_campaign_log(path)["months"], 120)
            path.write_text(line + line, encoding="utf-8")
            with self.assertRaises(ValueError):
                read_campaign_log(path)


if __name__ == "__main__":
    unittest.main()
