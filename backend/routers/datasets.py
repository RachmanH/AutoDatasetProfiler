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
    AnalyzeRequest, AnalyzeResponse, TargetRecommendation,
    ChartsResponse, HistoryResponse,
)
from services.parser import parse_upload
from services.profiler import profile_dataset, compute_data_quality
from services.task_suggestion import suggest_task, guess_target_columns
from services.charts import build_eda_charts, build_charts_from_recommendations
from services.preprocessing import generate_preprocessing_previews
from services.fingerprint import build_fingerprint
from services.llm import call_llm

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

_store: dict = {}


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload dataset CSV/XLSX",
    description=(
        "Upload file dataset (.csv atau .xlsx, maks 20 MB). File di-parse, disimpan sementara "
        "di memori server, dan metadata-nya dicatat di database. Mengembalikan dataset_id "
        "untuk dipakai pada endpoint lain."
    ),
    responses={
        400: {"description": "Format file tidak didukung (harus .csv atau .xlsx)"},
        413: {"description": "Ukuran file melebihi batas 20 MB"},
        422: {"description": "File gagal diparse atau dataset kosong"},
    },
)
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


@router.get(
    "/{dataset_id}/profile",
    response_model=ProfileResponse,
    summary="Profil kolom & kualitas data",
    description="Mengembalikan statistik per kolom (tipe, missing, unique, sample values) dan ringkasan kualitas data (duplikat, missing, kolom id-like/constant).",
    responses={404: {"description": "Dataset tidak ditemukan. Upload ulang file."}},
)
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


@router.get(
    "/{dataset_id}/task-suggestion",
    response_model=TaskSuggestion,
    summary="Saran task ML",
    description="Menyarankan task ML (klasifikasi/regresi/clustering, dst) berdasarkan profil dataset. Opsional `target_col` untuk mengarahkan saran ke kolom target tertentu.",
    responses={404: {"description": "Dataset tidak ditemukan. Upload ulang file."}},
)
def get_task_suggestion(dataset_id: str, target_col: str | None = None):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")

    raw_profiles = profile_dataset(df)
    result = suggest_task(df, target_col, raw_profiles)
    return TaskSuggestion(**result)


@router.get(
    "/{dataset_id}/charts",
    response_model=ChartsResponse,
    summary="EDA charts",
    description="Menghasilkan chart eksplorasi data (histogram, bar, pie, boxplot, scatter, heatmap) sesuai tipe tiap kolom.",
    responses={404: {"description": "Dataset tidak ditemukan. Upload ulang file."}},
)
def get_charts(dataset_id: str):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")
    raw_profiles = profile_dataset(df)
    return {"dataset_id": dataset_id, "charts": build_eda_charts(df, raw_profiles)}


@router.get(
    "/{dataset_id}/preprocessing",
    response_model=list[PreprocessingStep],
    summary="Preview preprocessing",
    description="Preview langkah preprocessing yang disarankan (imputasi, encoding, normalisasi, penanganan outlier) beserta contoh nilai sebelum/sesudah.",
    responses={404: {"description": "Dataset tidak ditemukan. Upload ulang file."}},
)
def get_preprocessing_preview(dataset_id: str):
    df = _store.get(dataset_id)
    if df is None:
        raise HTTPException(404, "Dataset tidak ditemukan. Upload ulang file.")
    raw_profiles = profile_dataset(df)
    steps = generate_preprocessing_previews(df, raw_profiles)
    return [PreprocessingStep(**s) for s in steps]


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Riwayat analisis",
    description="Mengembalikan 50 hasil analisis terakhir yang tersimpan di database.",
)
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


@router.get(
    "/{dataset_id}/analysis/{analysis_id}",
    summary="Ambil hasil analisis tersimpan",
    description="Mengambil kembali hasil analisis lengkap (payload sama seperti response `POST /analyze`) berdasarkan analysis_id.",
    responses={404: {"description": "Hasil analisis tidak ditemukan."}},
)
def get_analysis(dataset_id: str, analysis_id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(
        AnalysisResult.id == analysis_id,
        AnalysisResult.dataset_id == dataset_id,
    ).first()
    if result is None:
        raise HTTPException(404, "Hasil analisis tidak ditemukan.")
    return {"dataset_id": dataset_id, "analysis_id": analysis_id, **json.loads(result.result_json)}


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analisis penuh dataset",
    description=(
        "Menjalankan pipeline analisis lengkap: profiling kolom → fingerprint dataset ke LLM → "
        "saran task ML & kolom target → EDA charts → preview preprocessing. Hasil disimpan "
        "ke database dan dikembalikan analysis_id-nya."
    ),
    responses={404: {"description": "Dataset atau metadata dataset tidak ditemukan."}},
)
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
    preprocessing = [PreprocessingStep(**s) for s in generate_preprocessing_previews(df, raw_profiles)]

    fingerprint = build_fingerprint(df, raw_profiles, raw_quality, meta.model_dump(), req.target_col)
    llm_result = call_llm(fingerprint)

    target_candidates = (llm_result or {}).get("target_candidates") or []
    if not target_candidates:
        target_candidates = guess_target_columns(raw_profiles)
    resolved_target = req.target_col or (target_candidates[0]["column"] if target_candidates else None)
    task = TaskSuggestion(**suggest_task(df, resolved_target, raw_profiles))

    target_recommendations = [
        TargetRecommendation(
            column=c["column"],
            reason=c.get("reason", ""),
            confidence=c.get("confidence", "low"),
            task_suggestion=TaskSuggestion(**suggest_task(df, c["column"], raw_profiles)),
        )
        for c in target_candidates[:3]
    ] or None

    recommended_charts = (llm_result or {}).get("recommended_charts") or []
    charts = build_charts_from_recommendations(df, raw_profiles, recommended_charts) if recommended_charts else []
    if not charts:
        charts = build_eda_charts(df, raw_profiles)

    result_payload = {
        "meta": meta.model_dump(),
        "profiles": [p.model_dump() for p in profiles],
        "data_quality": quality.model_dump(),
        "task_suggestion": task.model_dump(),
        "charts": charts,
        "preprocessing": [s.model_dump() for s in preprocessing],
        "llm_understanding": llm_result,
        "target_recommendations": [t.model_dump() for t in target_recommendations] if target_recommendations else None,
    }

    db_result = AnalysisResult(
        dataset_id=req.dataset_id,
        target_column=resolved_target,
        result_json=json.dumps(result_payload, ensure_ascii=False),
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return AnalyzeResponse(
        dataset_id=req.dataset_id,
        analysis_id=db_result.id,
        target_col=resolved_target,
        **result_payload,
    )


@router.get(
    "/{dataset_id}/export/json",
    summary="Export hasil analisis (JSON)",
    description="Download hasil analisis sebagai file JSON (`analysis_{analysis_id}.json`) via `analysis_id` (query param).",
    responses={404: {"description": "Hasil analisis tidak ditemukan."}},
)
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


@router.get(
    "/{dataset_id}/export/csv",
    summary="Export profil kolom (CSV)",
    description="Download profil kolom (dari hasil analisis) sebagai file CSV (`profiles_{analysis_id}.csv`) via `analysis_id` (query param).",
    responses={404: {"description": "Hasil analisis tidak ditemukan."}},
)
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
