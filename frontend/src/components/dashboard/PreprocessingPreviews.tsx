import { useState } from 'react'
import type { PreprocessingStep } from '../../types'

interface Props {
  steps: PreprocessingStep[]
}

const STEP_LABEL: Record<string, string> = {
  handle_missing: 'Imputasi Missing',
  scale: 'Normalisasi',
  handle_outlier: 'Outlier',
  label_encode: 'Label Encoding',
  one_hot_encode: 'One-Hot Encoding',
  drop_column: 'Hapus Kolom',
}

const STEP_COLOR: Record<string, string> = {
  handle_missing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  scale: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  handle_outlier: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  label_encode: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  one_hot_encode: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  drop_column: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
}

export default function PreprocessingPreviews({ steps }: Props) {
  const [filter, setFilter] = useState('semua')

  const stepTypes = ['semua', ...Array.from(new Set(steps.map((s) => s.step)))]
  const filtered = filter === 'semua' ? steps : steps.filter((s) => s.step === filter)

  if (!steps.length) {
    return <p className="text-center text-slate-400 dark:text-slate-500 py-20">Tidak ada saran preprocessing.</p>
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {stepTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t === 'semua' ? 'Semua' : (STEP_LABEL[t] ?? t)}
          </button>
        ))}
        <span className="self-center text-xs text-slate-400 dark:text-slate-500">{filtered.length} langkah</span>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((step, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STEP_COLOR[step.step] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {STEP_LABEL[step.step] ?? step.step}
              </span>
              <code className="text-xs font-mono text-slate-500 dark:text-slate-400">{step.column}</code>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{step.method}</p>

            {step.step !== 'drop_column' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Sebelum</p>
                  <div className="space-y-1">
                    {step.before.map((v, j) => (
                      <div key={j} className="rounded bg-red-50 dark:bg-red-950/30 px-2 py-1 text-red-700 dark:text-red-400 truncate">
                        {String(v ?? 'null')}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 mb-1.5 font-medium">Sesudah</p>
                  <div className="space-y-1">
                    {step.after.map((v, j) => (
                      <div key={j} className="rounded bg-green-50 dark:bg-green-950/30 px-2 py-1 text-green-700 dark:text-green-400 truncate">
                        {String(v ?? 'null')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step.step === 'drop_column' && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                Kolom ini akan dihapus dari dataset.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
