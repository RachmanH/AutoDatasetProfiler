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
  handle_missing: 'bg-blue-100 text-blue-700',
  scale: 'bg-green-100 text-green-700',
  handle_outlier: 'bg-orange-100 text-orange-700',
  label_encode: 'bg-purple-100 text-purple-700',
  one_hot_encode: 'bg-pink-100 text-pink-700',
  drop_column: 'bg-red-100 text-red-600',
}

export default function PreprocessingPreviews({ steps }: Props) {
  const [filter, setFilter] = useState('semua')

  const stepTypes = ['semua', ...Array.from(new Set(steps.map((s) => s.step)))]
  const filtered = filter === 'semua' ? steps : steps.filter((s) => s.step === filter)

  if (!steps.length) {
    return <p className="text-center text-slate-400 py-20">Tidak ada saran preprocessing.</p>
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
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'semua' ? 'Semua' : (STEP_LABEL[t] ?? t)}
          </button>
        ))}
        <span className="self-center text-xs text-slate-400">{filtered.length} langkah</span>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((step, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STEP_COLOR[step.step] ?? 'bg-slate-100 text-slate-600'}`}>
                {STEP_LABEL[step.step] ?? step.step}
              </span>
              <code className="text-xs font-mono text-slate-500">{step.column}</code>
            </div>

            <p className="text-sm text-slate-600 mb-4">{step.method}</p>

            {step.step !== 'drop_column' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-1.5 font-medium">Sebelum</p>
                  <div className="space-y-1">
                    {step.before.map((v, j) => (
                      <div key={j} className="rounded bg-red-50 px-2 py-1 text-red-700 truncate">
                        {String(v ?? 'null')}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 mb-1.5 font-medium">Sesudah</p>
                  <div className="space-y-1">
                    {step.after.map((v, j) => (
                      <div key={j} className="rounded bg-green-50 px-2 py-1 text-green-700 truncate">
                        {String(v ?? 'null')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step.step === 'drop_column' && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                Kolom ini akan dihapus dari dataset.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
