import csv
import io
import json
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from db_models import Dataset, AnalysisResult
from models import (
    UploadResponse, DatasetMeta, ProfileResponse, ColumnProfile,
    DataQuality, TaskSuggestion, PreprocessingStep,
    AnalyzeRequest, AnalyzeResponse,
)
from services.parser import parse_upload
from services.profiler import profile_dataset, compute_data_quality
from services.task_suggestion import suggest_task
from services.charts import build_eda_charts
from services.preprocessing import generate_preprocessing_previews
from services.fingerprint import build_fingerprint
from services.llm import call_llm

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

_store: dict = {}


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    dataset_id, df, file_type = parse_upload(file, content)

    file_size_kb = round(len(content) / 1024, 2)
    meta = DatasetMeta(
        dataset_id=dataset_id,
        filename=file.filename or "unknown",
        file_type=file_type,
        row_count=len(df),
        column_count=len(df.columns),
        file_size_kb=file_size_kb,
        columns=df.columns.tolist(),
    )

    db.add(Dataset(
        id=dataset_id,
        filename=meta.filename,
        file_type=file_type,
        row_count=meta.row_count,
        column_count=meta.column_count,
        file_size_kb=file_size_kb,
    ))
    db.commit()

    _store[dataset_id] = df

    preview = json.loads(df.head(5).to_json(orient="records", date_format="iso"))

    return UploadResponse(dataset_id=dataset_id, meta=meta, preview=preview)


@router.get("/{dataset_id}/profile", response_model=ProfileResponse)
def get_profile(dataset_id: str):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    profiles = [ColumnProfile(**p) for p in raw_profiles]
    quality = DataQuality(**compute_data_quality(df, raw_profiles))

    return ProfileResponse(
        dataset_id=dataset_id,
        profiles=profiles,
        data_quality=quality,
    )


@router.get("/{dataset_id}/task-suggestion", response_model=TaskSuggestion)
def get_task_suggestion(dataset_id: str, target_col: str | None = None):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    result = suggest_task(df, target_col, raw_profiles)
    return TaskSuggestion(**result)


@router.get("/{dataset_id}/charts")
def get_charts(dataset_id: str):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")
    raw_profiles = profile_dataset(df)
    return {"dataset_id": dataset_id, "charts": build_eda_charts(df, raw_profiles)}


@router.get("/{dataset_id}/preprocessing", response_model=list[PreprocessingStep])
def get_preprocessing_preview(dataset_id: str):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")
    raw_profiles = profile_dataset(df)
    steps = generate_preprocessing_previews(df, raw_profiles)
    return [PreprocessingStep(**s) for s in steps]


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    results = db.query(AnalysisResult).order_by(AnalysisResult.created_at.desc()).limit(50).all()
    history = []
    for r in results:
        ds = db.get(Dataset, r.dataset_id)
        history.append({
            "analysis_id": r.id,
            "dataset_id": r.dataset_id,
            "filename": ds.filename if ds else "unknown",
            "target_column": r.target_column,
            "created_at": r.created_at.isoformat(),
        })
    return {"history": history}


@router.get("/{dataset_id}/analysis/{analysis_id}")
def get_analysis(dataset_id: str, analysis_id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(
        AnalysisResult.id == analysis_id,
        AnalysisResult.dataset_id == dataset_id,
    ).first()
    if result is None:
        raise HTTPException(404, "Hasil analisis tidak ditemukan.")
    return {"dataset_id": dataset_id, "analysis_id": analysis_id, **json.loads(result.result_json)}


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_dataset(req: AnalyzeRequest, db: Session = Depends(get_db)):
    df = _store.get(req.dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    db_dataset = db.get(Dataset, req.dataset_id)
    if db_dataset is None:
        raise HTTPException(404, "Metadata dataset tidak ditemukan di database.")

    meta = DatasetMeta(
        dataset_id=req.dataset_id,
        filename=db_dataset.filename,
        file_type=db_dataset.file_type,
        row_count=db_dataset.row_count,
        column_count=db_dataset.column_count,
        file_size_kb=db_dataset.file_size_kb,
        columns=df.columns.tolist(),
    )

    raw_profiles = profile_dataset(df)
    raw_quality = compute_data_quality(df, raw_profiles)
    profiles = [ColumnProfile(**p) for p in raw_profiles]
    quality = DataQuality(**raw_quality)
    task = TaskSuggestion(**suggest_task(df, req.target_col, raw_profiles))
    charts = build_eda_charts(df, raw_profiles)
    preprocessing = [PreprocessingStep(**s) for s in generate_preprocessing_previews(df, raw_profiles)]

    fingerprint = build_fingerprint(df, raw_profiles, raw_quality, meta.model_dump(), req.target_col)
    llm_result = call_llm(fingerprint)

    result_payload = {
        "meta": meta.model_dump(),
        "profiles": [p.model_dump() for p in profiles],
        "data_quality": quality.model_dump(),
        "task_suggestion": task.model_dump(),
        "charts": charts,
        "preprocessing": [s.model_dump() for s in preprocessing],
        "llm_understanding": llm_result,
    }

    db_result = AnalysisResult(
        dataset_id=req.dataset_id,
        target_column=req.target_col,
        result_json=json.dumps(result_payload, ensure_ascii=False),
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return AnalyzeResponse(
        dataset_id=req.dataset_id,
        analysis_id=db_result.id,
        target_col=req.target_col,
        **result_payload,
    )


@router.get("/{dataset_id}/export/json")
def export_json(dataset_id: str, analysis_id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(
        AnalysisResult.id == analysis_id,
        AnalysisResult.dataset_id == dataset_id,
    ).first()
    if result is None:
        raise HTTPException(404, "Hasil analisis tidak ditemukan.")

    content = result.result_json.encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id}.json"},
    )


@router.get("/{dataset_id}/export/csv")
def export_csv(dataset_id: str, analysis_id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(
        AnalysisResult.id == analysis_id,
        AnalysisResult.dataset_id == dataset_id,
    ).first()
    if result is None:
        raise HTTPException(404, "Hasil analisis tidak ditemukan.")

    data = json.loads(result.result_json)
    profiles = data.get("profiles", [])

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "column", "dtype", "detected_type", "unique_count",
        "missing_count", "missing_percentage",
    ])
    writer.writeheader()
    for p in profiles:
        writer.writerow({k: p.get(k, "") for k in writer.fieldnames})

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=profiles_{analysis_id}.csv"},
    )


def get_dataframe(dataset_id: str):
    return _store.get(dataset_id)
