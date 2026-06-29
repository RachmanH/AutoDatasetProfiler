import pandas as pd
import numpy as np


PREVIEW_ROWS = 5


def generate_preprocessing_previews(df: pd.DataFrame, profiles: list[dict]) -> list[dict]:
    previews = []

    for p in profiles:
        col = p["column"]
        dtype = p["detected_type"]
        missing_pct = p["missing_percentage"]

        if missing_pct > 0:
            if dtype == "numeric":
                previews.append(_impute_numeric(df, col))
            else:
                previews.append(_impute_categorical(df, col))

        if dtype == "numeric":
            previews.append(_scale_minmax(df, col))
            previews.append(_handle_outlier(df, col))

        if dtype == "categorical":
            n_unique = p["unique_count"]
            if n_unique <= 10:
                previews.append(_one_hot_encode(df, col))
            else:
                previews.append(_label_encode(df, col))

        if dtype in ("id_like", "constant"):
            previews.append(_drop_column(df, col))

    return previews


def _sample(series: pd.Series) -> list:
    return series.head(PREVIEW_ROWS).tolist()


def _impute_numeric(df: pd.DataFrame, col: str) -> dict:
    mean_val = round(float(df[col].mean()), 4)
    after = df[col].fillna(mean_val)
    return {
        "step": "handle_missing",
        "column": col,
        "method": f"Isi nilai kosong dengan rata-rata ({mean_val})",
        "before": _sample(df[col]),
        "after": _sample(after),
    }


def _impute_categorical(df: pd.DataFrame, col: str) -> dict:
    mode_val = df[col].mode()[0] if not df[col].mode().empty else "unknown"
    after = df[col].fillna(mode_val)
    return {
        "step": "handle_missing",
        "column": col,
        "method": f"Isi nilai kosong dengan modus ('{mode_val}')",
        "before": _sample(df[col]),
        "after": _sample(after),
    }


def _scale_minmax(df: pd.DataFrame, col: str) -> dict:
    s = df[col].dropna()
    mn, mx = s.min(), s.max()
    after = ((df[col] - mn) / (mx - mn)).round(4) if mx != mn else df[col] * 0
    return {
        "step": "scale",
        "column": col,
        "method": "Normalisasi Min-Max → rentang [0, 1]",
        "before": _sample(df[col]),
        "after": _sample(after),
    }


def _handle_outlier(df: pd.DataFrame, col: str) -> dict:
    q1 = df[col].quantile(0.25)
    q3 = df[col].quantile(0.75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    after = df[col].clip(lower=lower, upper=upper).round(4)
    return {
        "step": "handle_outlier",
        "column": col,
        "method": f"Winsorisasi IQR → [{round(lower,2)}, {round(upper,2)}]",
        "before": _sample(df[col]),
        "after": _sample(after),
    }


def _label_encode(df: pd.DataFrame, col: str) -> dict:
    mapping = {v: i for i, v in enumerate(df[col].dropna().unique())}
    after = df[col].map(mapping)
    return {
        "step": "label_encode",
        "column": col,
        "method": f"Label encoding → {dict(list(mapping.items())[:5])}{'...' if len(mapping)>5 else ''}",
        "before": _sample(df[col]),
        "after": _sample(after),
    }


def _one_hot_encode(df: pd.DataFrame, col: str) -> dict:
    dummies = pd.get_dummies(df[col], prefix=col)
    new_cols = dummies.columns.tolist()
    return {
        "step": "one_hot_encode",
        "column": col,
        "method": f"One-hot encoding → {len(new_cols)} kolom baru: {new_cols[:5]}{'...' if len(new_cols)>5 else ''}",
        "before": _sample(df[col]),
        "after": _sample(dummies.iloc[:, 0]),
    }


def _drop_column(df: pd.DataFrame, col: str) -> dict:
    return {
        "step": "drop_column",
        "column": col,
        "method": "Hapus kolom (ID-like atau konstan, tidak informatif)",
        "before": _sample(df[col]),
        "after": [],
    }
