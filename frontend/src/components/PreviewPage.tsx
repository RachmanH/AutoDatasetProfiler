import { useState } from 'react'
import { analyzeDataset } from '../api'
import type { UploadResponse, AnalyzeResponse } from '../types'
import { ProgressBar } from './ui/Skeleton'

interface Props {
  uploadData: UploadResponse
  onAnalyzed: (data: AnalyzeResponse) => void
  onBack: () => void
}

export default function PreviewPage({ uploadData, onAnalyzed, onBack }: Props) {
  const { meta, preview } = uploadData
  const [targetCol, setTargetCol] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setError(null)
    setLoading(true)
    try {
      const data = await analyzeDataset(meta.dataset_id, targetCol || null)
      onAnalyzed(data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Gagal menganalisis dataset. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button onClick={onBack} className="mb-6 text-sm text-slate-500 hover:text-slate-800 transition">
          ← Upload ulang
        </button>

        {/* File info */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">{meta.filename}</h2>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700 uppercase">
            {meta.file_type}
          </span>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          {[
            { label: 'Baris', value: meta.row_count.toLocaleString() },
            { label: 'Kolom', value: meta.column_count },
            { label: 'Ukuran', value: `${meta.file_size_kb.toFixed(1)} KB` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm">
              <div className="text-xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Preview table */}
        <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-600">
            Preview 5 baris pertama
          </p>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr>
                {meta.columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {meta.columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Target column */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-800">Pilih Kolom Target (opsional)</h3>
          <p className="mb-4 text-sm text-slate-500">
            Kolom yang ingin diprediksi / dianalisis. Kosongkan untuk analisis clustering.
          </p>
          <select
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Tidak ada (clustering) —</option>
            {meta.columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Menganalisis dataset...' : 'Mulai Analisis →'}
        </button>

        {loading && (
          <div className="mt-4">
            <ProgressBar label="Menganalisis dataset — bisa memakan waktu 1–3 menit..." />
          </div>
        )}
      </div>
    </div>
  )
}
