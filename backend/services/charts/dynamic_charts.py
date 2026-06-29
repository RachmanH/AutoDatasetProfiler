import pandas as pd


def build_dynamic_charts(df: pd.DataFrame, profiles: list[dict]) -> list[dict]:
    charts = []

    numeric_cols = [p["column"] for p in profiles if p["detected_type"] == "numeric"]
    cat_cols = [p["column"] for p in profiles if p["detected_type"] in ("categorical", "boolean")]

    if len(numeric_cols) >= 2:
        charts.append(_correlation_heatmap(df, numeric_cols))
        charts.append(_scatter(df, numeric_cols[0], numeric_cols[1]))

    if cat_cols and numeric_cols:
        charts.append(_grouped_bar(df, cat_cols[0], numeric_cols[0]))

    return charts


def _correlation_heatmap(df: pd.DataFrame, numeric_cols: list[str]) -> dict:
    corr = df[numeric_cols].corr().round(3)
    data = []
    for col_x in corr.columns:
        for col_y in corr.index:
            data.append({"x": col_x, "y": col_y, "value": float(corr.loc[col_y, col_x])})
    return {
        "type": "heatmap",
        "title": "Korelasi Antar Kolom Numerik",
        "columns": numeric_cols,
        "data": data,
    }


def _scatter(df: pd.DataFrame, col_x: str, col_y: str, sample: int = 300) -> dict:
    subset = df[[col_x, col_y]].dropna().head(sample)
    data = [{"x": round(float(r[col_x]), 4), "y": round(float(r[col_y]), 4)}
            for _, r in subset.iterrows()]
    return {
        "type": "scatter",
        "title": f"Scatter: {col_x} vs {col_y}",
        "x_col": col_x,
        "y_col": col_y,
        "data": data,
    }


def _grouped_bar(df: pd.DataFrame, cat_col: str, num_col: str, top_n: int = 10) -> dict:
    grouped = df.groupby(cat_col)[num_col].mean().nlargest(top_n).round(4)
    data = [{"name": str(k), "rata_rata": float(v)} for k, v in grouped.items()]
    return {
        "type": "grouped_bar",
        "title": f"Rata-rata {num_col} per {cat_col}",
        "cat_col": cat_col,
        "num_col": num_col,
        "data": data,
    }
