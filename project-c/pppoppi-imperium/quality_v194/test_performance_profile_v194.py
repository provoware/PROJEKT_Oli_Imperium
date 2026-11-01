"""Deterministic regression tests for descriptive browser timing metrics."""
import math
import unittest

from performance_profile_v194 import summarize_month_durations


class PerformanceProfileTests(unittest.TestCase):
    def test_even_sample_nearest_rank_and_halves(self):
        result = summarize_month_durations([4, 1, 3, 2])
        self.assertEqual(result["measured_months"], 4)
        self.assertEqual(result["month_steps_total_seconds"], 10)
        self.assertEqual(result["month_step_median_seconds"], 2.5)
        self.assertEqual(result["month_step_p95_seconds"], 4)
        self.assertEqual(result["month_step_p99_seconds"], 4)
        self.assertEqual(result["first_half_mean_seconds"], 2.5)
        self.assertEqual(result["second_half_mean_seconds"], 2.5)

    def test_single_month_has_no_second_half(self):
        result = summarize_month_durations([0.125])
        self.assertEqual(result["month_step_max_seconds"], 0.125)
        self.assertIsNone(result["second_half_mean_seconds"])

    def test_120_month_sample_and_tail(self):
        result = summarize_month_durations([0.1] * 119 + [10.0])
        self.assertEqual(result["measured_months"], 120)
        self.assertEqual(result["month_step_p95_seconds"], 0.1)
        self.assertEqual(result["month_step_p99_seconds"], 0.1)
        self.assertEqual(result["month_step_max_seconds"], 10.0)
        self.assertEqual(result["last_10_mean_seconds"], 1.09)

    def test_240_month_sample_p99(self):
        result = summarize_month_durations([1.0] * 237 + [2.0, 3.0, 4.0])
        self.assertEqual(result["measured_months"], 240)
        self.assertEqual(result["month_step_p99_seconds"], 2.0)
        self.assertEqual(result["month_step_max_seconds"], 4.0)

    def test_drift_ratios_use_chronological_months(self):
        result = summarize_month_durations([4, 1, 3, 2])
        self.assertEqual(result["second_half_vs_first_half_ratio"], 1.0)
        self.assertEqual(result["first_quarter_mean_seconds"], 4.0)
        self.assertEqual(result["last_quarter_mean_seconds"], 2.0)
        self.assertEqual(result["last_quarter_vs_first_quarter_ratio"], 0.5)
        result = summarize_month_durations([1, 2, 3, 4, 5])
        self.assertEqual(result["second_half_vs_first_half_ratio"], 2.667)
        self.assertEqual(result["last_quarter_vs_first_quarter_ratio"], 5.0)

    def test_zero_baseline_and_short_series_do_not_fake_growth(self):
        result = summarize_month_durations([0, 0, 1, 1])
        self.assertIsNone(result["second_half_vs_first_half_ratio"])
        self.assertIsNone(result["last_quarter_vs_first_quarter_ratio"])
        result = summarize_month_durations([0.125])
        self.assertIsNone(result["first_quarter_mean_seconds"])
        self.assertIsNone(result["last_quarter_mean_seconds"])
        self.assertIsNone(result["second_half_vs_first_half_ratio"])

    def test_invalid_measurements_rejected(self):
        for samples in ([], [-0.1], [math.nan], [math.inf], ["bad"]):
            with self.subTest(samples=samples):
                with self.assertRaises((ValueError, TypeError)):
                    summarize_month_durations(samples)


if __name__ == "__main__":
    unittest.main()
