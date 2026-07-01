from .static_charts import build_static_charts, _histogram, _boxplot, _bar, _pie
from .dynamic_charts import build_dynamic_charts, _correlation_heatmap, _scatter, _grouped_bar


def build_eda_charts(df, profiles: list[dict]) -> list[dict]:
    charts = build_static_charts(df, profiles)
    charts += build_dynamic_charts(df, profiles)
    return charts


def build_charts_from_recommendations(df, profiles: list[dict], recommendations: list[dict]) -> list[dict]:
    """Build only the charts the LLM recommended, reusing the same per-type builders."""
    profile_map = {p["column"]: p for p in profiles}
    charts = []
    for rec in recommendations:
        try:
            chart = _build_one(df, profile_map, rec.get("type"), rec.get("columns") or [])
        except Exception:
            chart = None
        if chart:
            charts.append(chart)
    return charts


def _build_one(df, profile_map: dict, chart_type: str, cols: list[str]) -> dict | None:
    cols = [c for c in cols if c in profile_map]
    if not cols:
        return None

    if chart_type == "histogram":
        if profile_map[cols[0]]["detected_type"] != "numeric":
            return None
        return _histogram(df[cols[0]], cols[0])
    if chart_type == "boxplot":
        if profile_map[cols[0]]["detected_type"] != "numeric":
            return None
        return _boxplot(df[cols[0]], cols[0])
    if chart_type == "bar":
        return _bar(df[cols[0]], cols[0])
    if chart_type == "pie":
        return _pie(df[cols[0]], cols[0])
    if chart_type == "heatmap":
        if len(cols) < 2:
            return None
        return _correlation_heatmap(df, cols)
    if chart_type == "scatter":
        if len(cols) < 2:
            return None
        return _scatter(df, cols[0], cols[1])
    if chart_type == "grouped_bar":
        cat_col, num_col = _pick_cat_num(profile_map, cols)
        if not cat_col or not num_col:
            return None
        return _grouped_bar(df, cat_col, num_col)
    return None


def _pick_cat_num(profile_map: dict, cols: list[str]) -> tuple[str | None, str | None]:
    numeric = [c for c in cols if profile_map[c]["detected_type"] == "numeric"]
    cat = [c for c in cols if profile_map[c]["detected_type"] in ("categorical", "boolean")]
    if numeric and cat:
        return cat[0], numeric[0]
    return None, None
