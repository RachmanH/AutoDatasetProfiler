import { useState } from 'react'
import type { AnalyzeResponse } from '../../types'
import { CONFIDENCE_COLOR } from '../../lib/badgeColors'

interface Props {
  data: AnalyzeResponse
  onRetarget: (targetCol: string) => Promise<void>
}

const TASK_ICON: Record<string, string> = {
  binary_classification: '🎯',
  multiclass_classification: '🏷️',
  regression: '📉',
  count_regression: '🔢',
  clustering_candidate: '🔵',
  unknown: '❓',
}

export default function TaskSuggestion({ data, onRetarget }: Props) {
  const { task_suggestion, llm_understanding, target_recommendations, target_col } = data
  const llm = llm_understanding as Record<string, unknown> | null
  const [switching, setSwitching] = useState<string | null>(null)

  async function handleUse(column: string) {
    setSwitching(column)
    try {
      await onRetarget(column)
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Rule-based suggestion */}
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          Target Terpakai: {target_col ? <code className="normal-case">{target_col}</code> : 'Tidak ada'}
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{TASK_ICON[task_suggestion.suggested_task] ?? '❓'}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{task_suggestion.task_label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLOR[task_suggestion.confidence] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {task_suggestion.confidence}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{task_suggestion.reason}</p>
          </div>
        </div>
      </div>

      {/* AI target recommendations */}
      {target_recommendations && target_recommendations.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-950/30 p-6">
          <h3 className="mb-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Rekomendasi Kolom Target (AI)</h3>
          <div className="space-y-3">
            {target_recommendations.map((rec, i) => (
              <div key={rec.column} className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-800 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                      {i === 0 ? 'Terbaik' : i === 1 ? 'Alternatif 2' : 'Alternatif 3'}
                    </span>
                    <code className="text-xs font-mono bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">{rec.column}</code>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLOR[rec.confidence] ?? ''}`}>
                      {rec.confidence}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{rec.reason}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Task: {rec.task_suggestion.task_label}</p>
                </div>
                <button
                  onClick={() => handleUse(rec.column)}
                  disabled={switching !== null || rec.column === target_col}
                  className="shrink-0 rounded-lg border border-indigo-300 dark:border-indigo-700 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 transition"
                >
                  {rec.column === target_col ? 'Sedang Dipakai' : switching === rec.column ? 'Memuat...' : 'Gunakan Kolom Ini'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM suggestion */}
      {llm && (
        <div className="rounded-2xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/30 p-6">
          <h3 className="mb-4 text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Analisis LLM</h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Domain</p>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">{String(llm.domain_guess ?? '-')}</p>
            </div>
            <div>
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Pemahaman Dataset</p>
              <p className="text-sm text-purple-900 dark:text-purple-200">{String(llm.dataset_understanding ?? '-')}</p>
            </div>
            <div>
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Saran Task ML</p>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">{String(llm.suggested_task ?? '-')} — {String(llm.task_reason ?? '')}</p>
            </div>

            {Array.isArray(llm.methodological_warnings) && llm.methodological_warnings.length > 0 && (
              <div>
                <p className="text-xs text-purple-500 dark:text-purple-400 mb-2">⚠️ Peringatan Metodologi</p>
                <ul className="space-y-1">
                  {(llm.methodological_warnings as string[]).map((w, i) => (
                    <li key={i} className="text-xs text-purple-800 dark:text-purple-300">· {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
