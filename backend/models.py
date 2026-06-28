from pydantic import BaseModel
from typing import Any


class DatasetMeta(BaseModel):
    dataset_id: str
    filename: str
    file_type: str
    row_count: int
    column_count: int
    file_size_kb: float
    columns: list[str]


class UploadResponse(BaseModel):
    dataset_id: str
    meta: DatasetMeta
    preview: list[dict[str, Any]]
