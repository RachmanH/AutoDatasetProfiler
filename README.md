# AutoDataset Profiler

Aplikasi analisis dataset otomatis berbasis web. Upload file CSV atau XLSX dan dapatkan analisis eksploratif data (EDA) lengkap dalam hitungan detik — tanpa coding, tanpa setup tambahan.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Upload CSV/XLSX | Drag-and-drop, validasi format dan ukuran (maks. 20 MB) |
| Profiling Kolom | Deteksi tipe otomatis: numeric, categorical, datetime, boolean, text, id_like |
| Penilaian Kualitas | Missing values, duplikat, high-cardinality, kolom konstan |
| Chart EDA | Histogram, bar chart, pie chart, boxplot, scatter, heatmap korelasi |
| Rekomendasi ML Task | Rule-based: binary classification, multiclass, regression, clustering |
| Analisis LLM | Fingerprinting dataset → insight tanpa mengirim data mentah |
| Preview Preprocessing | Imputasi, encoding, normalisasi, penanganan outlier (before/after) |
| Perbandingan Kolom | Bandingkan distribusi dan statistik dua kolom secara berdampingan |
| Research PRD | Generate dokumen PRD penelitian berbasis LLM |
| Riwayat Analisis | Semua hasil analisis tersimpan di SQLite, dapat diakses kembali |
| Ekspor | Unduh hasil sebagai JSON, CSV, atau PDF |
| Dark Mode | Toggle terang/gelap, disimpan di localStorage |

## Tech Stack

**Backend**
- Python 3.12+
- FastAPI + Uvicorn
- SQLAlchemy + SQLite
- Pandas, NumPy, Scikit-learn
- Requests (LLM API client)

**Frontend**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Recharts
- Axios
- html2canvas + jsPDF

**LLM**
- OpenCode Zen API (fingerprint-based, tanpa raw data)

## Arsitektur

```
Browser (React SPA)
        │
        │ HTTP (Axios, proxy Vite)
        ▼
FastAPI Backend
    ├── /api/datasets    → upload, profiling, analisis, ekspor, riwayat
    ├── /api/llm         → dataset understanding (fingerprint → LLM)
    └── /api/research    → saran penelitian, generate PRD
        │
        ├── services/
        │   ├── parser.py          ← baca CSV/XLSX
        │   ├── profiler.py        ← deteksi tipe, statistik kolom
        │   ├── task_suggestion.py ← rule-based ML task
        │   ├── charts/            ← generate data chart EDA
        │   ├── preprocessing.py   ← preview transformasi data
        │   ├── fingerprint.py     ← ringkasan kompak tanpa raw data
        │   ├── llm.py             ← call LLM, 3-tier JSON repair
        │   └── research.py        ← saran judul, PRD
        │
        └── SQLite (autodataset.db)
            ├── datasets           ← metadata file yang diupload
            └── analysis_results   ← hasil analisis JSON
```

## Setup

### Prasyarat

- Python 3.12+ (disarankan via pyenv)
- Node.js 20+
- API key OpenCode (opsional — fitur LLM tidak aktif tanpa ini)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Buat file .env
cp .env.example .env
# Isi OPENCODE_API_KEY di .env

uvicorn main:app --reload
# Backend berjalan di http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:5173
```

Buka browser ke `http://localhost:5173`.

### Menjalankan Unit Test

```bash
cd backend
pytest tests/ -v
```

## Variabel Environment

| Variabel | Default | Keterangan |
|---|---|---|
| `OPENCODE_API_KEY` | — | API key untuk fitur LLM |
| `OPENCODE_MODEL` | `o4-mini` | Model yang digunakan |
| `MAX_FILE_SIZE_MB` | `20` | Ukuran maksimum file upload |
| `DATABASE_URL` | `sqlite:///./autodataset.db` | Lokasi database SQLite |

## Struktur Project

```
AutoDatasetProfiler/
├── backend/
│   ├── main.py              ← FastAPI app, CORS, router, init DB
│   ├── config.py            ← environment variables
│   ├── database.py          ← SQLAlchemy engine & session
│   ├── db_models.py         ← tabel Dataset & AnalysisResult
│   ├── models.py            ← Pydantic request/response models
│   ├── routers/
│   │   ├── datasets.py
│   │   ├── llm.py
│   │   └── research.py
│   ├── services/
│   │   ├── parser.py
│   │   ├── profiler.py
│   │   ├── task_suggestion.py
│   │   ├── preprocessing.py
│   │   ├── fingerprint.py
│   │   ├── llm.py
│   │   ├── research.py
│   │   └── charts/
│   └── tests/
│       ├── test_profiler.py
│       ├── test_task_suggestion.py
│       └── test_llm_parsing.py
└── frontend/
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── types.ts
        ├── hooks/
        │   └── useDarkMode.ts
        └── components/
            ├── LandingPage.tsx
            ├── UploadPage.tsx
            ├── PreviewPage.tsx
            ├── ResultDashboard.tsx
            ├── ResearchPRDPage.tsx
            ├── HistoryPage.tsx
            ├── ui/
            │   ├── Skeleton.tsx
            │   └── DarkModeToggle.tsx
            └── dashboard/
                ├── OverviewStats.tsx
                ├── ColumnProfiles.tsx
                ├── EDACharts.tsx
                ├── TaskSuggestion.tsx
                ├── PreprocessingPreviews.tsx
                ├── ColumnComparison.tsx
                └── ExportPanel.tsx
```

## Alur Aplikasi

```
Landing → Upload File → Preview & Pilih Target Kolom
       → Analisis (profiling + chart + LLM)
       → Dashboard Hasil (7 tab)
       → Research PRD (opsional)
```
