# AutoDataset Profiler API

API untuk upload dataset, profiling kolom, deteksi task ML, EDA chart, preprocessing preview, dan insight LLM.

Swagger UI: `http://localhost:8000/docs` | OpenAPI raw: `API_DOCUMENTATION.json`

## datasets

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/datasets/upload` | Upload file CSV/XLSX (maks 20MB), parse & simpan sementara di memori server, catat metadata ke DB. Return `dataset_id`. |
| GET | `/api/datasets/{dataset_id}/profile` | Statistik per kolom (tipe, missing, unique, sample) + ringkasan kualitas data (duplikat, missing, kolom id-like/constant). |
| GET | `/api/datasets/{dataset_id}/task-suggestion?target_col=` | Saran task ML (klasifikasi/regresi/clustering) berdasarkan profil, opsional diarahkan ke `target_col`. |
| GET | `/api/datasets/{dataset_id}/charts` | Chart EDA (histogram, bar, pie, boxplot, scatter, heatmap) sesuai tipe tiap kolom. |
| GET | `/api/datasets/{dataset_id}/preprocessing` | Preview langkah preprocessing (imputasi, encoding, normalisasi, outlier) beserta contoh sebelum/sesudah. |
| POST | `/api/datasets/analyze` | Pipeline penuh: profiling → fingerprint ke LLM → saran task & target → chart EDA → preprocessing. Simpan hasil, return `analysis_id`. |
| GET | `/api/datasets/history` | 50 hasil analisis terakhir dari DB. |
| GET | `/api/datasets/{dataset_id}/analysis/{analysis_id}` | Ambil kembali hasil analisis tersimpan (payload sama seperti `POST /analyze`). |
| GET | `/api/datasets/{dataset_id}/export/json?analysis_id=` | Download hasil analisis sebagai `analysis_{id}.json`. |
| GET | `/api/datasets/{dataset_id}/export/csv?analysis_id=` | Download profil kolom sebagai `profiles_{id}.csv`. |

## llm

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/llm/dataset-understanding` | Kirim fingerprint dataset (tanpa data mentah) ke LLM, dapat insight/interpretasi konten dataset. |

## research

| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/research/suggestions` | Saran judul/topik riset via LLM berdasarkan fingerprint dataset. |
| POST | `/api/research/generate-prd` | Generate dokumen PRD riset (markdown) via LLM. Butuh `selected_title`, `selected_task`, `background`, `research_questions`. |

## Error umum

- `404` — dataset/analisis tidak ditemukan, upload/generate ulang.
- `422` — validation error (body/param salah).
- `503` — (endpoint llm & research) LLM tidak tersedia / API key tidak dikonfigurasi.

## Schema utama

- `UploadResponse` → `dataset_id`, `meta` (DatasetMeta), `preview`
- `AnalyzeResponse` → `meta`, `profiles[]`, `data_quality`, `task_suggestion`, `charts[]`, `preprocessing[]`, `llm_understanding`, `target_recommendations[]`
- `ColumnProfile` → column, dtype, detected_type, unique_count, missing_count/percentage, sample_values, stats (mean/median/std/min/max)
- `DataQuality` → total_cells, missing_cells/percentage, duplicate_rows/percentage, id_like_columns, constant_columns, high_missing_columns
- `TaskSuggestion` → suggested_task, task_label, reason, confidence
- `TargetRecommendation` → column, reason, confidence, task_suggestion
