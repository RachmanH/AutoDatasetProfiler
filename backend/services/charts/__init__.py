from .static_charts import build_static_charts
from .dynamic_charts import build_dynamic_charts


def build_eda_charts(df, profiles: list[dict]) -> list[dict]:
    charts = build_static_charts(df, profiles)
    charts += build_dynamic_charts(df, profiles)
    return charts
