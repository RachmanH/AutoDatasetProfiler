import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.llm import _parse_llm_response, _repair_truncated

FINGERPRINT = {"column_names": ["umur", "pendapatan", "label"]}


def test_parse_valid_json():
    raw = '{"dataset_understanding": "test", "domain_guess": "kesehatan", "target_candidates": [{"column": "label", "reason": "target", "confidence": "high"}], "suggested_task": "binary_classification", "task_reason": "2 kelas", "recommended_charts": [], "preprocessing_suggestions": [], "methodological_warnings": [], "user_confirmation_needed": []}'
    result = _parse_llm_response(raw, FINGERPRINT)
    assert result is not None
    assert result["suggested_task"] == "binary_classification"


def test_parse_json_with_extra_text():
    raw = 'Berikut analisis saya:\n\n{"dataset_understanding": "tes", "domain_guess": "keuangan", "target_candidates": [], "suggested_task": "regression", "task_reason": "numerik", "recommended_charts": [], "preprocessing_suggestions": [], "methodological_warnings": [], "user_confirmation_needed": []}\n\nSemoga membantu!'
    result = _parse_llm_response(raw, FINGERPRINT)
    assert result is not None
    assert result["domain_guess"] == "keuangan"


def test_repair_truncated_json():
    truncated = '{"dataset_understanding": "tes", "target_candidates": [{"column": "label"'
    repaired = _repair_truncated(truncated)
    assert repaired.count("{") == repaired.count("}")
    assert repaired.count("[") == repaired.count("]")


def test_hallucinated_columns_filtered():
    raw = '{"dataset_understanding": "tes", "domain_guess": "tes", "target_candidates": [{"column": "kolom_palsu", "reason": "x", "confidence": "high"}, {"column": "label", "reason": "y", "confidence": "high"}], "suggested_task": "binary_classification", "task_reason": "ok", "recommended_charts": [{"type": "bar", "columns": ["kolom_palsu"], "reason": "x"}, {"type": "histogram", "columns": ["umur"], "reason": "y"}], "preprocessing_suggestions": [], "methodological_warnings": [], "user_confirmation_needed": []}'
    result = _parse_llm_response(raw, FINGERPRINT)
    assert result is not None
    cols = [c["column"] for c in result["target_candidates"]]
    assert "kolom_palsu" not in cols
    assert "label" in cols
    chart_cols = [c["columns"][0] for c in result["recommended_charts"]]
    assert "kolom_palsu" not in chart_cols


def test_invalid_json_returns_none():
    raw = "ini bukan json sama sekali"
    result = _parse_llm_response(raw, FINGERPRINT)
    assert result is None
