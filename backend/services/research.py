import json
import re
import requests
from config import OPENCODE_API_KEY, OPENCODE_MODEL, OPENCODE_URL


def get_research_suggestions(fingerprint: dict) -> dict | None:
    if not OPENCODE_API_KEY:
        return None

    prompt = f"""Berdasarkan dataset berikut, berikan saran penelitian dalam format JSON:

{json.dumps(fingerprint, ensure_ascii=False, indent=2)}

Respons HARUS berupa JSON valid:
{{
  "suggested_titles": ["judul penelitian 1", "judul penelitian 2", "judul penelitian 3"],
  "suggested_tasks": [
    {{"task": "nama task ML", "reason": "alasan"}}
  ],
  "research_questions": ["pertanyaan penelitian 1", "pertanyaan penelitian 2", "pertanyaan penelitian 3"],
  "potential_variables": {{
    "independent": ["variabel bebas 1"],
    "dependent": ["variabel terikat 1"]
  }}
}}

Gunakan bahasa Indonesia. Hanya JSON, tanpa teks lain."""

    return _call(prompt)


def generate_research_prd(
    fingerprint: dict,
    selected_title: str,
    selected_task: str,
    background: str,
    research_questions: list[str],
) -> str | None:
    if not OPENCODE_API_KEY:
        return None

    prompt = f"""Tulis dokumen PRD penelitian dalam Markdown, bahasa Indonesia akademis. Output HANYA markdown, tanpa teks pengantar.

Informasi:
- Judul: {selected_title}
- Task ML: {selected_task}
- Latar belakang: {background}
- Pertanyaan penelitian: {'; '.join(research_questions)}
- Dataset: {fingerprint.get('metadata', {}).get('rows', '?')} baris, {fingerprint.get('metadata', {}).get('columns', '?')} kolom

Struktur dokumen:
# {selected_title}

## 1. Latar Belakang
## 2. Rumusan Masalah
## 3. Tujuan Penelitian
## 4. Metodologi
### 4.1 Dataset
### 4.2 Preprocessing
### 4.3 Model yang Digunakan
### 4.4 Evaluasi
## 5. Ekspektasi Hasil
## 6. Timeline
## 7. Referensi"""

    result = _call_raw(prompt, temperature=0.0, max_tokens=8000)
    return result


def _call(prompt: str) -> dict | None:
    raw = _call_raw(prompt)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        import re
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                return None
    return None


def _call_raw(prompt: str, temperature: float = 0.4, max_tokens: int = 3000) -> str | None:
    try:
        resp = requests.post(
            OPENCODE_URL,
            headers={"Authorization": f"Bearer {OPENCODE_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": OPENCODE_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=90,
        )
        resp.raise_for_status()
        msg = resp.json()["choices"][0]["message"]
        content = (msg.get("content") or "").strip()
        return content or None
    except Exception:
        return None
