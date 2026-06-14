"""Unit tests for the pure Brier / calibration math (hand-computed)."""

import pytest

from calledit.services import scoring


def test_normalize_probability_accepts_fraction_and_percent():
    assert scoring.normalize_probability(0.7) == 0.7
    assert scoring.normalize_probability(70) == 0.7
    assert scoring.normalize_probability(100) == 1.0
    assert scoring.normalize_probability(1) == 1.0  # boundary: 1 stays a fraction
    assert scoring.normalize_probability(150) == 1.0  # clamped
    assert scoring.normalize_probability(-5) == 0.0  # clamped


def test_brier_score_hand_computed():
    # (0.8-1)^2 + (0.2-0)^2 + (0.9-1)^2 = 0.04 + 0.04 + 0.01 = 0.09; /3 = 0.03
    resolved = [(0.8, 1), (0.2, 0), (0.9, 1)]
    assert scoring.brier_score(resolved) == pytest.approx(0.03)


def test_brier_score_empty_is_none():
    assert scoring.brier_score([]) is None


def test_brier_labels():
    assert scoring.brier_label(0.05) == "oracle"
    assert scoring.brier_label(0.1) == "oracle"
    assert scoring.brier_label(0.2) == "sharp"
    assert scoring.brier_label(0.35) == "decent"
    assert scoring.brier_label(0.5) == "wishful"
    assert scoring.brier_label(None) is None


def test_accuracy():
    # p>0.5 means "predicts happens". Right when (p>0.5)==(o==1).
    resolved = [(0.8, 1), (0.2, 0), (0.9, 0), (0.4, 1)]
    # correct: (0.8,1)yes, (0.2,0)yes, (0.9,0)no, (0.4,1)no -> 2/4 = 50%
    assert scoring.accuracy(resolved) == 50.0


def test_brier_contribution():
    assert scoring.brier_contribution(0.8, 1) == pytest.approx(0.04)
    assert scoring.brier_contribution(0.9, 0) == pytest.approx(0.81)


def test_calibration_deciles():
    resolved = [(0.05, 0), (0.07, 0), (0.95, 1), (0.92, 1)]
    points = scoring.calibration_curve(resolved)
    assert len(points) == 2
    low, high = points
    assert low["bucket"] == "0-10%"
    assert low["n"] == 2
    assert low["hit_rate"] == 0.0
    assert high["bucket"] == "90-100%"
    assert high["n"] == 2
    assert high["hit_rate"] == 1.0
