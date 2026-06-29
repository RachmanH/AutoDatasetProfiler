import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
from services.profiler import profile_dataset
from services.task_suggestion import suggest_task


def _profiles(df):
    return profile_dataset(df)


def test_no_target_suggests_clustering():
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
    result = suggest_task(df, None, _profiles(df))
    assert result["suggested_task"] == "clustering_candidate"


def test_binary_classification():
    df = pd.DataFrame({"fitur": [1.0, 2.0, 3.0], "label": ["ya", "tidak", "ya"]})
    result = suggest_task(df, "label", _profiles(df))
    assert result["suggested_task"] == "binary_classification"


def test_multiclass_classification():
    df = pd.DataFrame({
        "fitur": [1, 2, 3, 4, 5],
        "kelas": ["A", "B", "C", "A", "B"],
    })
    result = suggest_task(df, "kelas", _profiles(df))
    assert result["suggested_task"] == "multiclass_classification"


def test_regression():
    df = pd.DataFrame({
        "x": [1.0, 2.0, 3.0, 4.0, 5.0],
        "y": [10.5, 20.1, 30.7, 40.2, 50.9],
    })
    result = suggest_task(df, "y", _profiles(df))
    assert result["suggested_task"] == "regression"


def test_invalid_target_returns_unknown():
    df = pd.DataFrame({"a": [1, 2, 3]})
    result = suggest_task(df, "kolom_tidak_ada", _profiles(df))
    assert result["suggested_task"] == "unknown"


def test_confidence_present():
    df = pd.DataFrame({"f": [1, 2, 3], "t": ["a", "b", "a"]})
    result = suggest_task(df, "t", _profiles(df))
    assert "confidence" in result
    assert result["confidence"] in ("high", "medium", "low")
