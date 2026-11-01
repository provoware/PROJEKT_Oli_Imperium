"""Compare two real Chromium campaign runs; never issue a release verdict."""
import argparse
import json
import math
from pathlib import Path

PREFIX = "BROWSER-LANGKAMPAGNE: "
METRICS = (
    ("end_to_end_seconds",),
    ("month_step_profile", "month_steps_total_seconds"),
    ("month_step_profile", "month_step_median_seconds"),
    ("month_step_profile", "month_step_p95_seconds"),
    ("month_step_profile", "month_step_p99_seconds"),
    ("month_step_profile", "month_step_max_seconds"),
    ("month_step_profile", "second_half_vs_first_half_ratio"),
)


def read_campaign_log(path):
    """Require exactly one complete final result, not incidental PASS lines."""
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    records = [line.split(PREFIX, 1)[1] for line in lines if PREFIX in line]
    if len(records) != 1:
        raise ValueError(f"expected one final campaign summary in {path}; got {len(records)}")
    record = json.loads(records[0])
    if not isinstance(record, dict):
        raise ValueError("campaign summary must be a JSON object")
    return record


def _number(record, path, *, positive=False):
    value = record
    for key in path:
        if not isinstance(value, dict) or key not in value:
            raise ValueError("missing metric: " + ".".join(path))
        value = value[key]
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError("nonfinite metric: " + ".".join(path))
    if value < 0 or (positive and value == 0):
        raise ValueError("invalid metric: " + ".".join(path))
    return value


def validate(record, expected_months):
    if type(expected_months) is not int or expected_months < 4:
        raise ValueError("expected months must be >= 4")
    if record.get("months") != expected_months:
        raise ValueError("campaign duration mismatch")
    if record.get("viewport") != "800x600" or record.get("keyboard") != "Enter":
        raise ValueError("campaign browser configuration mismatch")
    if record.get("human_turns") != 4 * expected_months:
        raise ValueError("human turn count mismatch")
    if record.get("chromium_processes") != 3:
        raise ValueError("expected three independent Chromium processes")
    if record.get("release_gate") != "BLOCKED" or not str(record.get("performance_release_gate", "")).startswith("BLOCKED"):
        raise ValueError("comparison cannot override release gates")
    if not isinstance(record.get("month_step_profile"), dict) or record["month_step_profile"].get("measured_months") != expected_months:
        raise ValueError("incomplete month timing series")
    if not isinstance(record.get("state_size_profile"), dict) or record["state_size_profile"].get("sampled_months") != expected_months:
        raise ValueError("incomplete state-size series")
    if record.get("retained_reports") != min(expected_months, 120):
        raise ValueError("unexpected report retention")
    for path in METRICS:
        _number(record, path, positive=True)
    if _number(record, ("month_step_profile", "month_steps_total_seconds")) > _number(record, ("end_to_end_seconds",)):
        raise ValueError("monthly time exceeds end-to-end time")
    correlation = record["state_size_profile"].get("month_to_month_change_pearson_r")
    if correlation is not None and (type(correlation) not in (int, float) or not math.isfinite(correlation) or abs(correlation) > 1):
        raise ValueError("invalid month-to-month correlation")


def compare(first, second, expected_months):
    """Provide descriptive within-runner differences, without arbitrary limits."""
    validate(first, expected_months)
    validate(second, expected_months)
    metrics = {}
    for path in METRICS:
        key = ".".join(path)
        a, b = _number(first, path), _number(second, path)
        metrics[key] = {"run_1": a, "run_2": b, "run_2_vs_run_1_percent": round(100 * (b - a) / a, 2)}
    return {
        "months_per_run": expected_months,
        "runs": 2,
        "viewport": "800x600",
        "human_turns_per_run": 4 * expected_months,
        "natural_rescues": [first.get("natural_rescues"), second.get("natural_rescues")],
        "metrics": metrics,
        "release_gate": "BLOCKED: descriptive repeatability only; no agreed hardware or performance thresholds",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("first_log")
    parser.add_argument("second_log")
    parser.add_argument("--months", type=int, required=True)
    args = parser.parse_args()
    result = compare(read_campaign_log(args.first_log), read_campaign_log(args.second_log), args.months)
    print("REPEATABILITY-CAMPAIGN: " + json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
