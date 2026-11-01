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
        "first_half_mean_seconds": rounded(statistics.mean(values[:halfway or count])),
        "second_half_mean_seconds": rounded(statistics.mean(values[halfway:])) if halfway else None,
        "last_10_mean_seconds": rounded(statistics.mean(values[-10:])),
        "measurement_scope": "browser month steps including midpoint reload; excludes build and final archive reload",
    }
