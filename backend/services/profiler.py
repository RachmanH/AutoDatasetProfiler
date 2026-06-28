import pandas as pd
import numpy as np


def detect_column_type(series: pd.Series, col_name: str) -> str:
    name = col_name.lower()

    if series.nunique() <= 1:
        return "constant"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_numeric_dtype(series):
        unique_ratio = series.nunique() / max(len(series), 1)
        id_keywords = ("id", "uuid", "code", "no", "num", "index", "key")
        if any(kw in name for kw in id_keywords) and unique_ratio > 0.9:
            return "id_like"
        return "numeric"

    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"

    converted = pd.to_datetime(series, errors="coerce", infer_datetime_format=True)
    if converted.notna().mean() > 0.8:
        return "datetime"

    unique_ratio = series.nunique() / max(len(series), 1)
    if unique_ratio > 0.9 and len(series) > 50:
        return "id_like"

    avg_len = series.dropna().astype(str).str.len().mean()
    if avg_len > 50 and series.nunique() > 20:
        return "text"

    if series.nunique() <= 20 or unique_ratio < 0.05:
        return "categorical"

    return "text"


def profile_column(series: pd.Series, col_name: str) -> dict:
    detected_type = detect_column_type(series, col_name)
    total = len(series)
    missing = int(series.isna().sum())

    profile: dict = {
        "column": col_name,
        "dtype": str(series.dtype),
        "detected_type": detected_type,
        "unique_count": int(series.nunique()),
        "missing_count": missing,
        "missing_percentage": round(missing / total * 100, 2) if total else 0,
        "sample_values": series.dropna().head(5).tolist(),
        "stats": None,
    }

    if detected_type == "numeric":
        desc = series.describe()
        profile["stats"] = {
            "mean": round(float(desc["mean"]), 4),
            "median": round(float(series.median()), 4),
            "std": round(float(desc["std"]), 4),
            "min": round(float(desc["min"]), 4),
            "max": round(float(desc["max"]), 4),
        }

    return profile


def profile_dataset(df: pd.DataFrame) -> list[dict]:
    return [profile_column(df[col], col) for col in df.columns]


def compute_data_quality(df: pd.DataFrame, profiles: list[dict]) -> dict:
    total_cells = df.size
    missing_cells = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    id_like_cols = [p["column"] for p in profiles if p["detected_type"] == "id_like"]
    constant_cols = [p["column"] for p in profiles if p["detected_type"] == "constant"]
    high_missing_cols = [
        p["column"] for p in profiles if p["missing_percentage"] > 50
    ]

    return {
        "total_cells": total_cells,
        "missing_cells": missing_cells,
        "missing_percentage": round(missing_cells / total_cells * 100, 2) if total_cells else 0,
        "duplicate_rows": duplicate_rows,
        "duplicate_percentage": round(duplicate_rows / len(df) * 100, 2) if len(df) else 0,
        "id_like_columns": id_like_cols,
        "constant_columns": constant_cols,
        "high_missing_columns": high_missing_cols,
    }
