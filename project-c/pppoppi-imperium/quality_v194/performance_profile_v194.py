"""Descriptive per-month browser timings; not a release performance gate."""
import math
import statistics


def summarize_month_durations(durations):
    """Return stable nearest-rank percentiles for observed month steps.

    Measurements include browser interaction, rescue handling and midpoint
    reload when applicable; they exclude the final archive reload and build.
    """
    values = [float(value) for value in durations]
    if not values or any(not math.isfinite(value) or value < 0 for value in values):
        raise ValueError("month durations must be nonempty, finite and nonnegative")
    ordered = sorted(values)
    count = len(values)
    halfway = count // 2
    quarter = count // 4
    first_half_mean = statistics.mean(values[:halfway or count])
    second_half_mean = statistics.mean(values[halfway:]) if halfway else None
    first_quarter_mean = statistics.mean(values[:quarter]) if quarter else None
    last_quarter_mean = statistics.mean(values[-quarter:]) if quarter else None

    def rounded(value):
        return round(value, 3)

    def nearest_rank(percent):
        return rounded(ordered[math.ceil(percent * count) - 1])

    return {
        "measured_months": count,
        "month_steps_total_seconds": rounded(sum(values)),
        "month_step_median_seconds": rounded(statistics.median(values)),
        "month_step_p95_seconds": nearest_rank(0.95),
        "month_step_p99_seconds": nearest_rank(0.99),
        "month_step_max_seconds": rounded(ordered[-1]),
        "first_half_mean_seconds": rounded(first_half_mean),
        "second_half_mean_seconds": rounded(second_half_mean) if second_half_mean is not None else None,
        "second_half_vs_first_half_ratio": rounded(second_half_mean / first_half_mean) if second_half_mean is not None and first_half_mean > 0 else None,
        "first_quarter_mean_seconds": rounded(first_quarter_mean) if first_quarter_mean is not None else None,
        "last_quarter_mean_seconds": rounded(last_quarter_mean) if last_quarter_mean is not None else None,
        "last_quarter_vs_first_quarter_ratio": rounded(last_quarter_mean / first_quarter_mean) if first_quarter_mean is not None and first_quarter_mean > 0 else None,
        "last_10_mean_seconds": rounded(statistics.mean(values[-10:])),
        "measurement_scope": "browser month steps including midpoint reload; excludes build and final archive reload",
    }
