import json
import re
import requests
from config import OPENCODE_API_KEY, OPENCODE_MODEL, OPENCODE_URL

SYSTEM_PROMPT = """Anda adalah asisten analisis data yang ahli.
Anda akan menerima ringkasan (fingerprint) sebuah dataset dan harus memberikan analisis mendalam dalam format JSON.

Respons HARUS berupa JSON valid dengan struktur berikut:
{
  "dataset_understanding": "penjelasan singkat tentang dataset ini",
  "domain_guess": "perkiraan domain/bidang dataset (misal: kesehatan, keuangan, dll)",
  "target_candidates": [
    {"column": "nama_kolom", "reason": "alasan", "confidence": "high/medium/low"}
  ],
  "suggested_task": "binary_classification|multiclass_classification|regression|count_regression|clustering_candidate|unknown",
  "task_reason": "alasan pemilihan task",
  "recommended_charts": [
    {"type": "bar|histogram|pie|scatter|boxplot|grouped_bar|heatmap", "columns": ["col1"], "reason": "alasan"}
  ],
  "preprocessing_suggestions": ["saran preprocessing 1", "saran preprocessing 2"],
  "methodological_warnings": ["peringatan 1"],
  "user_confirmation_needed": ["hal yang perlu dikonfirmasi user"]
}

Gunakan bahasa Indonesia. Jangan tambahkan teks di luar JSON."""


def call_llm(fingerprint: dict) -> dict | None:
    if not OPENCODE_API_KEY:
        return None

    payload = {
        "model": OPENCODE_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analisis dataset ini:\n\n{json.dumps(fingerprint, ensure_ascii=False, indent=2)}"},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }

    try:
        resp = requests.post(
            OPENCODE_URL,
            headers={"Authorization": f"Bearer {OPENCODE_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        msg = resp.json()["choices"][0]["message"]
        raw = msg.get("content") or msg.get("reasoning_content") or ""
        if not raw:
            return None
        return _parse_llm_response(raw, fingerprint)
    except Exception:
        return None


def _parse_llm_response(raw: str, fingerprint: dict) -> dict | None:
    """3-tier JSON repair strategy."""
    parsed = None

    # Tier 1: direct parse
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Tier 2: extract JSON object between first { and last }
    if parsed is None:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group())
            except json.JSONDecodeError:
                pass

    # Tier 3: repair truncated JSON by closing open brackets
    if parsed is None:
        try:
            repaired = _repair_truncated(raw)
            parsed = json.loads(repaired)
        except Exception:
            return None

    return _validate_llm_output(parsed, fingerprint)


def _repair_truncated(text: str) -> str:
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")
    text = text.rstrip().rstrip(",")
    text += "]" * max(open_brackets, 0)
    text += "}" * max(open_braces, 0)
    return text


def _validate_llm_output(data: dict, fingerprint: dict) -> dict:
    """Filter hallucinated column names."""
    valid_cols = set(fingerprint.get("column_names", []))

    candidates = data.get("target_candidates", [])
    data["target_candidates"] = [
        c for c in candidates if c.get("column") in valid_cols
    ]

    charts = data.get("recommended_charts", [])
    data["recommended_charts"] = [
        c for c in charts
        if all(col in valid_cols for col in c.get("columns", []))
    ]

    required_keys = [
        "dataset_understanding", "domain_guess", "target_candidates",
        "suggested_task", "task_reason", "recommended_charts",
        "preprocessing_suggestions", "methodological_warnings", "user_confirmation_needed",
    ]
    for key in required_keys:
        if key not in data:
            data[key] = [] if key not in ("dataset_understanding", "domain_guess", "suggested_task", "task_reason") else ""

    return data
