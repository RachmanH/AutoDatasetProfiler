import pandas as pd


def build_static_charts(df: pd.DataFrame, profiles: list[dict]) -> list[dict]:
    charts = []
    for p in profiles:
        col = p["column"]
        dtype = p["detected_type"]

        if dtype == "numeric":
            charts.append(_histogram(df[col], col))
            charts.append(_boxplot(df[col], col))
        elif dtype in ("categorical", "boolean"):
            n_unique = p["unique_count"]
            if n_unique <= 5:
                charts.append(_pie(df[col], col))
            else:
                charts.append(_bar(df[col], col))

    return charts


def _histogram(series: pd.Series, col: str) -> dict:
    clean = series.dropna()
    counts, edges = pd.cut(clean, bins=min(20, clean.nunique()), retbins=True)
    freq = counts.value_counts(sort=False)
    data = [
        {"name": f"{edges[i]:.2f}–{edges[i+1]:.2f}", "jumlah": int(v)}
        for i, v in enumerate(freq.values)
    ]
    return {"type": "histogram", "column": col, "title": f"Distribusi {col}", "data": data}


def _boxplot(series: pd.Series, col: str) -> dict:
    clean = series.dropna()
    q1 = float(clean.quantile(0.25))
    median = float(clean.median())
    q3 = float(clean.quantile(0.75))
    iqr = q3 - q1
    data = [{
        "name": col,
        "min": round(float(clean.clip(lower=q1 - 1.5 * iqr).min()), 4),
        "q1": round(q1, 4),
        "median": round(median, 4),
        "q3": round(q3, 4),
        "max": round(float(clean.clip(upper=q3 + 1.5 * iqr).max()), 4),
    }]
    return {"type": "boxplot", "column": col, "title": f"Boxplot {col}", "data": data}


def _bar(series: pd.Series, col: str, top_n: int = 15) -> dict:
    counts = series.value_counts().head(top_n)
    data = [{"name": str(k), "jumlah": int(v)} for k, v in counts.items()]
    return {"type": "bar", "column": col, "title": f"Frekuensi {col}", "data": data}


def _pie(series: pd.Series, col: str) -> dict:
    counts = series.value_counts()
    data = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
    return {"type": "pie", "column": col, "title": f"Proporsi {col}", "data": data}
