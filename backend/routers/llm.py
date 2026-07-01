from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.datasets import get_dataframe
from services.profiler import profile_dataset, compute_data_quality
from services.fingerprint import build_fingerprint
from services.llm import call_llm

router = APIRouter(prefix="/api/llm", tags=["llm"])


class LLMRequest(BaseModel):
    dataset_id: str
    target_col: str | None = None
    meta: dict | None = None


@router.post(
    "/dataset-understanding",
    summary="Insight LLM tentang dataset",
    description="Mengirim fingerprint dataset (ringkasan tanpa data mentah) ke LLM untuk mendapatkan interpretasi/insight konten dataset.",
    responses={
        404: {"description": "Dataset tidak ditemukan. Upload ulang file."},
        503: {"description": "LLM tidak tersedia atau API key tidak dikonfigurasi."},
    },
)
def dataset_understanding(req: LLMRequest):
    df = get_dataframe(req.dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    quality = compute_data_quality(df, raw_profiles)
    fingerprint = build_fingerprint(df, raw_profiles, quality, req.meta or {}, req.target_col)

    result = call_llm(fingerprint)
    if result is None:
        raise HTTPException(503, "LLM tidak tersedia atau API key tidak dikonfigurasi.")

    return {"dataset_id": req.dataset_id, "llm_understanding": result}
