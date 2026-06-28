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


class ColumnStats(BaseModel):
    mean: float
    median: float
    std: float
    min: float
    max: float


class ColumnProfile(BaseModel):
    column: str
    dtype: str
    detected_type: str
    unique_count: int
    missing_count: int
    missing_percentage: float
    sample_values: list[Any]
    stats: ColumnStats | None = None


class DataQuality(BaseModel):
    total_cells: int
    missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    id_like_columns: list[str]
    constant_columns: list[str]
    high_missing_columns: list[str]


class ProfileResponse(BaseModel):
    dataset_id: str
    profiles: list[ColumnProfile]
    data_quality: DataQuality


class TaskSuggestion(BaseModel):
    suggested_task: str
    task_label: str
    reason: str
    confidence: str
