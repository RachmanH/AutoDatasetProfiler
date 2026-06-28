import json
import os
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database import get_db
from db_models import Dataset
from models import UploadResponse, DatasetMeta
from services.parser import parse_upload

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


def get_dataframe(dataset_id: str):
    return _store.get(dataset_id)
