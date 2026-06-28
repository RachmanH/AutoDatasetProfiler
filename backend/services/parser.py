import uuid
import os
import pandas as pd
from fastapi import UploadFile, HTTPException
from config import MAX_FILE_SIZE_MB, UPLOAD_DIR


def _validate(file: UploadFile, content: bytes) -> None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".csv", ".xlsx"):
        raise HTTPException(400, "Format file tidak didukung. Gunakan CSV atau XLSX.")
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(413, f"Ukuran file melebihi batas {MAX_FILE_SIZE_MB} MB.")


def parse_upload(file: UploadFile, content: bytes) -> tuple[str, pd.DataFrame, str]:
    """Return (dataset_id, dataframe, file_type)."""
    _validate(file, content)

    ext = os.path.splitext(file.filename or "")[1].lower()
    dataset_id = f"ds_{uuid.uuid4().hex[:12]}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    tmp_path = os.path.join(UPLOAD_DIR, f"{dataset_id}{ext}")
    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        df = pd.read_csv(tmp_path) if ext == ".csv" else pd.read_excel(tmp_path)
    except Exception as e:
        raise HTTPException(422, f"Gagal membaca file: {e}")

    if df.empty:
        raise HTTPException(422, "Dataset kosong.")
    if df.columns.duplicated().any():
        raise HTTPException(422, "Dataset memiliki nama kolom duplikat.")

    file_type = "csv" if ext == ".csv" else "xlsx"
    return dataset_id, df, file_type
