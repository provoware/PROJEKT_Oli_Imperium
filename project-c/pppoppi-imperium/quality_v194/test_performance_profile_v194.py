"""Deterministic regression tests for descriptive browser timing metrics."""
import math
import unittest

from performance_profile_v194 import summarize_month_durations, summarize_campaign_phase_timing


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


    def test_midpoint_restart_is_separate_from_gameplay(self):
        phases = {
            "midpoint": {"export": 0.2, "restart": 0.3, "import": 0.5},
            "archive": {"export": 0.2, "restart": 0.3, "import": 0.4},
        }
        result = summarize_campaign_phase_timing([1, 2, 3, 4], phases)
        self.assertEqual(result["midpoint_month"], 2)
        self.assertEqual(result["midpoint_month_raw_seconds"], 2)
        self.assertEqual(result["midpoint_io_total_seconds"], 1)
        self.assertEqual(result["midpoint_month_without_io_seconds"], 1)
        self.assertEqual(result["archive_io_total_seconds"], 0.9)
        self.assertEqual(
            result["month_step_profile_without_midpoint_io"]["second_half_vs_first_half_ratio"], 3.5)
        self.assertEqual(phases["midpoint"]["restart"], 0.3)

    def test_phase_validation_rejects_incomplete_and_impossible_measurements(self):
        valid = {
            "midpoint": {"export": 0.2, "restart": 0.3, "import": 0.5},
            "archive": {"export": 0.2, "restart": 0.3, "import": 0.4},
        }
        for invalid in (
            {"midpoint": {"export": 0.2}, "archive": valid["archive"]},
            {"midpoint": {"export": 1, "restart": 2, "import": 3}, "archive": valid["archive"]},
            {"midpoint": valid["midpoint"], "archive": {"export": math.nan, "restart": 0.3, "import": 0.4}},
            {"midpoint": valid["midpoint"]},
        ):
            with self.subTest(invalid=invalid):
                with self.assertRaises((ValueError, TypeError)):
                    summarize_campaign_phase_timing([1, 2, 3, 4], invalid)

    def test_phase_timing_keeps_raw_months_and_handles_odd_series(self):
        phases = {
            "midpoint": {"export": 0.1, "restart": 0.2, "import": 0.2},
            "archive": {"export": 0.1, "restart": 0.2, "import": 0.2},
        }
        original = [1, 2, 3, 4, 5]
        result = summarize_campaign_phase_timing(original, phases)
        self.assertEqual(original, [1, 2, 3, 4, 5])
        self.assertEqual(result["midpoint_month"], 2)
        self.assertEqual(result["midpoint_month_without_io_seconds"], 1.5)
        with self.assertRaises(ValueError):
            summarize_campaign_phase_timing([1], phases)


    def test_state_growth_tracks_observed_size(self):
        from performance_profile_v194 import summarize_campaign_state_growth
        result = summarize_campaign_state_growth([1, 2, 3, 4], [100, 200, 300, 400])
        self.assertEqual(result["sampled_months"], 4)
        self.assertEqual(result["first_month_state_bytes"], 100)
        self.assertEqual(result["last_month_state_bytes"], 400)
        self.assertEqual(result["max_state_bytes"], 400)
        self.assertEqual(result["last_vs_first_quarter_size_ratio"], 4.0)
        self.assertEqual(result["duration_vs_state_size_pearson_r"], 1.0)

    def test_state_growth_constant_size_has_no_correlation(self):
        from performance_profile_v194 import summarize_campaign_state_growth
        result = summarize_campaign_state_growth([1, 2, 3, 4], [100] * 4)
        self.assertIsNone(result["duration_vs_state_size_pearson_r"])
        self.assertEqual(result["last_vs_first_quarter_size_ratio"], 1.0)

    def test_state_growth_rejects_incomplete_or_invalid_samples(self):
        from performance_profile_v194 import summarize_campaign_state_growth
        for durations, sizes in (
            ([1, 2, 3], [100, 200, 300]),
            ([1, 2, 3, 4], [100, 200, 300]),
            ([1, 2, 3, 4], [100, 200, 300, True]),
            ([1, 2, 3, 4], [100, 200, 300, -1]),
            ([1, 2, math.nan, 4], [100, 200, 300, 400]),
        ):
            with self.subTest(durations=durations, sizes=sizes):
                with self.assertRaises(ValueError):
                    summarize_campaign_state_growth(durations, sizes)


if __name__ == "__main__":
    unittest.main()
