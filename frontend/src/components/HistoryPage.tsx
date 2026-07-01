import { useState, useEffect } from 'react'
import { getHistory } from '../api'
import type { HistoryItem } from '../types'
import { SkeletonCard } from './ui/Skeleton'

interface Props {
  onBack: () => void
}

export default function HistoryPage({ onBack }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => setError('Gagal mengambil riwayat analisis.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition">← Kembali</button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Riwayat Analisis</h2>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="card p-12 text-center text-slate-400 dark:text-slate-500">
            <div className="text-4xl mb-3">📭</div>
            <p>Belum ada analisis yang tersimpan.</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.analysis_id} className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.filename}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {item.target_column && (
                        <span className="rounded-full bg-blue-100 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                          Target: {item.target_column}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                        ID: {item.analysis_id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={`/api/datasets/${item.dataset_id}/export/json?analysis_id=${item.analysis_id}`}
                        download
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        JSON
                      </a>
                      <a
                        href={`/api/datasets/${item.dataset_id}/export/csv?analysis_id=${item.analysis_id}`}
                        download
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        CSV
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
