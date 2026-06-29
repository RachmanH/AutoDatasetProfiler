from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from routers.datasets import get_dataframe
from services.profiler import profile_dataset, compute_data_quality
from services.fingerprint import build_fingerprint
from services.research import get_research_suggestions, generate_research_prd

router = APIRouter(prefix="/api/research", tags=["research"])


class SuggestionsRequest(BaseModel):
    dataset_id: str
    target_col: str | None = None
    meta: dict | None = None


class PRDRequest(BaseModel):
    dataset_id: str
    selected_title: str
    selected_task: str
    background: str
    research_questions: list[str]
    target_col: str | None = None
    meta: dict | None = None


@router.post("/suggestions")
def research_suggestions(req: SuggestionsRequest):
    df = get_dataframe(req.dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    quality = compute_data_quality(df, raw_profiles)
    fingerprint = build_fingerprint(df, raw_profiles, quality, req.meta or {}, req.target_col)

    result = get_research_suggestions(fingerprint)
    if result is None:
        raise HTTPException(503, "LLM tidak tersedia atau API key tidak dikonfigurasi.")

    return {"dataset_id": req.dataset_id, "suggestions": result}


@router.post("/generate-prd")
def generate_prd(req: PRDRequest):
    df = get_dataframe(req.dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    quality = compute_data_quality(df, raw_profiles)
    fingerprint = build_fingerprint(df, raw_profiles, quality, req.meta or {}, req.target_col)

    prd_markdown = generate_research_prd(
        fingerprint,
        req.selected_title,
        req.selected_task,
        req.background,
        req.research_questions,
    )
    if not prd_markdown:
        raise HTTPException(503, "LLM tidak tersedia atau API key tidak dikonfigurasi.")

    return {"dataset_id": req.dataset_id, "prd_markdown": prd_markdown}
