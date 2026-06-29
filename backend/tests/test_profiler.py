import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import pytest
from services.profiler import detect_column_type, profile_column, profile_dataset, compute_data_quality


def test_detect_numeric():
    s = pd.Series([1.0, 2.5, 3.0, 4.1, 5.0])
    assert detect_column_type(s, "harga") == "numeric"


def test_detect_categorical():
    s = pd.Series(["A", "B", "A", "C", "B", "A", "C"])
    assert detect_column_type(s, "kategori") == "categorical"


def test_detect_constant():
    s = pd.Series([1, 1, 1, 1, 1])
    assert detect_column_type(s, "konstan") == "constant"


def test_detect_boolean():
    s = pd.Series([True, False, True, False])
    assert detect_column_type(s, "aktif") == "boolean"


def test_detect_id_like():
    s = pd.Series([f"id_{i}" for i in range(100)])
    assert detect_column_type(s, "user_id") == "id_like"


def test_profile_column_numeric_has_stats():
    s = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    profile = profile_column(s, "nilai")
    assert profile["stats"] is not None
    assert "mean" in profile["stats"]
    assert profile["missing_count"] == 0


def test_profile_column_missing():
    s = pd.Series([1.0, None, 3.0, None, 5.0])
    profile = profile_column(s, "data")
    assert profile["missing_count"] == 2
    assert profile["missing_percentage"] == 40.0


def test_profile_dataset_returns_all_columns():
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["x", "y", "z"]})
    profiles = profile_dataset(df)
    assert len(profiles) == 2
    assert profiles[0]["column"] == "a"
    assert profiles[1]["column"] == "b"


def test_compute_data_quality_duplicates():
    df = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
    profiles = profile_dataset(df)
    quality = compute_data_quality(df, profiles)
    assert quality["duplicate_rows"] == 1


def test_compute_data_quality_high_missing():
    df = pd.DataFrame({"a": [None, None, None, None, 1.0]})
    profiles = profile_dataset(df)
    quality = compute_data_quality(df, profiles)
    assert "a" in quality["high_missing_columns"]
