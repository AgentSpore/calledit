"""Per-member Brier scoring and decile calibration.

Ported from HunchLog's proven math (github.com/AgentSpore/hunchlog,
src/hunchlog/services/scoring.py) and adapted to per-member scoring.

All functions are pure (no I/O) so the math is trivially unit-testable.
A resolved forecast is a (probability p in 0..1, outcome o in {0, 1}) pair.
"""

from collections.abc import Sequence

# Minimum resolved forecasts before a member earns a leaderboard rank.
MIN_RANKED_FORECASTS = 3

_BUCKET_LABELS = [
    "0-10%",
    "10-20%",
    "20-30%",
    "30-40%",
    "40-50%",
    "50-60%",
    "60-70%",
    "70-80%",
    "80-90%",
    "90-100%",
]


def normalize_probability(value: float) -> float:
    """Accept a probability as 0..1 or 0..100 and return it in 0..1.

    Values > 1 are treated as percentages. The result is clamped to [0, 1].
    """
    p = value / 100.0 if value > 1 else value
    return max(0.0, min(1.0, p))


def _bucket_index(p: float) -> int:
    """Return the decile bucket index 0..9 for probability p in 0..1."""
    return min(int(p * 10), 9)


def brier_score(resolved: Sequence[tuple[float, int]]) -> float | None:
    """Mean of (p - o)^2 over resolved forecasts, or None if empty."""
    if not resolved:
        return None
    return sum((p - o) ** 2 for p, o in resolved) / len(resolved)


def brier_contribution(p: float, o: int) -> float:
    """Single resolved forecast's (p - o)^2 contribution."""
    return (p - o) ** 2


def brier_label(brier: float | None) -> str | None:
    """Friendly label for a Brier score (lower is better)."""
    if brier is None:
        return None
    if brier <= 0.1:
        return "oracle"
    if brier <= 0.2:
        return "sharp"
    if brier <= 0.35:
        return "decent"
    return "wishful"


def accuracy(resolved: Sequence[tuple[float, int]]) -> float | None:
    """Percentage of forecasts whose side (p > 0.5) matched the outcome."""
    if not resolved:
        return None
    correct = sum(1 for p, o in resolved if (p > 0.5) == (o == 1))
    return 100.0 * correct / len(resolved)


def calibration_curve(
    resolved: Sequence[tuple[float, int]],
) -> list[dict[str, float | int | str]]:
    """Bucket resolved forecasts into deciles; emit non-empty buckets.

    For each non-empty bucket: mean_prob = mean of p, hit_rate = fraction
    with o == 1, n = count. Ordered by ascending bucket.
    """
    buckets: list[list[tuple[float, int]]] = [[] for _ in range(10)]
    for p, o in resolved:
        buckets[_bucket_index(p)].append((p, o))

    points: list[dict[str, float | int | str]] = []
    for idx, rows in enumerate(buckets):
        if not rows:
            continue
        n = len(rows)
        points.append(
            {
                "bucket": _BUCKET_LABELS[idx],
                "mean_prob": sum(p for p, _ in rows) / n,
                "hit_rate": sum(o for _, o in rows) / n,
                "n": n,
            }
        )
    return points
