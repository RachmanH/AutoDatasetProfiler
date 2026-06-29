import json
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from db_models import Dataset
from models import UploadResponse, DatasetMeta, ProfileResponse, ColumnProfile, DataQuality, TaskSuggestion
from services.parser import parse_upload
from services.profiler import profile_dataset, compute_data_quality
from services.task_suggestion import suggest_task
from services.charts import build_eda_charts

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


def get_dataframe(dataset_id: str):
    return _store.get(dataset_id)
