import json
import pandas as pd


def build_fingerprint(
    df: pd.DataFrame,
    profiles: list[dict],
    quality: dict,
    meta: dict,
    target_col: str | None = None,
) -> dict:
    """Compact dataset summary dikirim ke LLM — bukan raw data."""
    col_summaries = []
    for p in profiles:
        summary: dict = {
            "column": p["column"],
            "type": p["detected_type"],
            "unique": p["unique_count"],
            "missing_pct": p["missing_percentage"],
            "samples": p["sample_values"][:3],
        }
        if p.get("stats"):
            summary["stats"] = {
                "mean": p["stats"]["mean"],
                "min": p["stats"]["min"],
                "max": p["stats"]["max"],
            }
        col_summaries.append(summary)

    preview = json.loads(df.head(3).to_json(orient="records", date_format="iso"))

    return {
        "metadata": {
            "filename": meta.get("filename", ""),
            "rows": meta.get("row_count", len(df)),
            "columns": meta.get("column_count", len(df.columns)),
            "file_type": meta.get("file_type", ""),
        },
        "column_names": df.columns.tolist(),
        "preview_rows": preview,
        "column_profiles": col_summaries,
        "data_quality": {
            "missing_pct": quality.get("missing_percentage", 0),
            "duplicate_rows": quality.get("duplicate_rows", 0),
            "id_like_columns": quality.get("id_like_columns", []),
            "constant_columns": quality.get("constant_columns", []),
            "high_missing_columns": quality.get("high_missing_columns", []),
        },
        "target_column": target_col,
    }
