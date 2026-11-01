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

def summarize_campaign_phase_timing(durations, phase_timings):
    """Measure browser I/O separately; preserve the original raw monthly timings.

    The midpoint restart is included in its month step, while archive I/O
    occurs after the final month step. Values are descriptive, not release gates.
    """
    values = [float(value) for value in durations]
    summarize_month_durations(values)
    if len(values) < 2:
        raise ValueError("campaign requires at least two month steps")
    if not isinstance(phase_timings, dict) or set(phase_timings) != {"midpoint", "archive"}:
        raise ValueError("expected midpoint and archive timing groups")
    required = {"export", "restart", "import"}
    phases = {}
    for stage in ("midpoint", "archive"):
        source = phase_timings[stage]
        if not isinstance(source, dict) or set(source) != required:
            raise ValueError("incomplete timing phases: " + stage)
        phases[stage] = {}
        for key in sorted(required):
            value = float(source[key])
            if not math.isfinite(value) or value < 0:
                raise ValueError("invalid timing phase: " + stage + "/" + key)
            phases[stage][key] = round(value, 3)
    midpoint_index = len(values) // 2 - 1
    midpoint_io = sum(phases["midpoint"].values())
    # Three independently rounded measurements may differ by a few ms.
    if midpoint_io > values[midpoint_index] + 0.005:
        raise ValueError("midpoint I/O exceeds observed month step")
    normalized = list(values)
    normalized[midpoint_index] = round(max(0.0, values[midpoint_index] - midpoint_io), 3)
    return {
        "midpoint_month": midpoint_index + 1,
        "midpoint_month_raw_seconds": round(values[midpoint_index], 3),
        "midpoint_io_total_seconds": round(midpoint_io, 3),
        "midpoint_month_without_io_seconds": normalized[midpoint_index],
        "archive_io_total_seconds": round(sum(phases["archive"].values()), 3),
        "phase_timings_seconds": phases,
        "month_step_profile_without_midpoint_io": summarize_month_durations(normalized),
        "measurement_scope": "midpoint I/O inside month step; archive I/O outside month steps",
    }
