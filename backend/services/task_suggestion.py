import pandas as pd


TASK_TYPES = {
    "binary_classification": "Klasifikasi Biner",
    "multiclass_classification": "Klasifikasi Multi-Kelas",
    "regression": "Regresi",
    "count_regression": "Regresi Jumlah",
    "clustering_candidate": "Kandidat Clustering",
    "unknown": "Tidak Diketahui",
}


def suggest_task(df: pd.DataFrame, target_col: str | None, profiles: list[dict]) -> dict:
    if not target_col:
        return {
            "suggested_task": "clustering_candidate",
            "task_label": TASK_TYPES["clustering_candidate"],
            "reason": "Tidak ada kolom target dipilih. Dataset cocok untuk analisis clustering.",
            "confidence": "low",
        }

    if target_col not in df.columns:
        return {
            "suggested_task": "unknown",
            "task_label": TASK_TYPES["unknown"],
            "reason": "Kolom target tidak ditemukan di dataset.",
            "confidence": "low",
        }

    target = df[target_col].dropna()
    nunique = target.nunique()
    target_profile = next((p for p in profiles if p["column"] == target_col), None)
    detected_type = target_profile["detected_type"] if target_profile else "unknown"

    if detected_type == "numeric":
        if nunique <= 2:
            return _result("binary_classification", "Target numerik dengan 2 nilai unik.", "high")
        is_integer = (target == target.astype(int, errors="ignore")).all()
        if is_integer and target.min() >= 0 and nunique <= 20:
            return _result("count_regression", "Target numerik integer non-negatif dengan kardinalitas rendah.", "medium")
        return _result("regression", "Target numerik kontinu.", "high")

    if detected_type in ("categorical", "boolean"):
        if nunique == 2:
            return _result("binary_classification", "Target kategorikal dengan 2 kelas.", "high")
        if nunique <= 20:
            return _result("multiclass_classification", f"Target kategorikal dengan {nunique} kelas.", "high")
        return _result("unknown", "Target kategorikal dengan terlalu banyak kelas unik.", "low")

    return _result("unknown", f"Tipe kolom target '{detected_type}' tidak cocok untuk task standar.", "low")


def _result(task: str, reason: str, confidence: str) -> dict:
    return {
        "suggested_task": task,
        "task_label": TASK_TYPES.get(task, task),
        "reason": reason,
        "confidence": confidence,
    }
