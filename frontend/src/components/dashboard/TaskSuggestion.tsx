import type { AnalyzeResponse } from '../../types'

interface Props {
  data: AnalyzeResponse
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-600',
}

const TASK_ICON: Record<string, string> = {
  binary_classification: '🎯',
  multiclass_classification: '🏷️',
  regression: '📉',
  count_regression: '🔢',
  clustering_candidate: '🔵',
  unknown: '❓',
}

export default function TaskSuggestion({ data }: Props) {
  const { task_suggestion, llm_understanding } = data
  const llm = llm_understanding as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      {/* Rule-based suggestion */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">Saran Task (Berbasis Aturan)</h3>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{TASK_ICON[task_suggestion.suggested_task] ?? '❓'}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-slate-800">{task_suggestion.task_label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_COLOR[task_suggestion.confidence] ?? 'bg-slate-100 text-slate-600'}`}>
                {task_suggestion.confidence}
              </span>
            </div>
            <p className="text-sm text-slate-500">{task_suggestion.reason}</p>
          </div>
        </div>
      </div>

      {/* LLM suggestion */}
      {llm && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-purple-700 uppercase tracking-wide">Analisis LLM</h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-purple-500 mb-1">Domain</p>
              <p className="text-sm font-medium text-purple-900">{String(llm.domain_guess ?? '-')}</p>
            </div>
            <div>
              <p className="text-xs text-purple-500 mb-1">Pemahaman Dataset</p>
              <p className="text-sm text-purple-900">{String(llm.dataset_understanding ?? '-')}</p>
            </div>
            <div>
              <p className="text-xs text-purple-500 mb-1">Saran Task ML</p>
              <p className="text-sm font-medium text-purple-900">{String(llm.suggested_task ?? '-')} — {String(llm.task_reason ?? '')}</p>
            </div>

            {Array.isArray(llm.target_candidates) && llm.target_candidates.length > 0 && (
              <div>
                <p className="text-xs text-purple-500 mb-2">Kandidat Kolom Target</p>
                <div className="space-y-2">
                  {(llm.target_candidates as {column:string,reason:string,confidence:string}[]).map((c) => (
                    <div key={c.column} className="flex items-start gap-2 rounded-xl bg-white/60 p-3">
                      <code className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{c.column}</code>
                      <div>
                        <span className={`text-xs font-medium ${CONFIDENCE_COLOR[c.confidence] ?? ''}`}>{c.confidence}</span>
                        <p className="text-xs text-purple-700 mt-0.5">{c.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(llm.methodological_warnings) && llm.methodological_warnings.length > 0 && (
              <div>
                <p className="text-xs text-purple-500 mb-2">⚠️ Peringatan Metodologi</p>
                <ul className="space-y-1">
                  {(llm.methodological_warnings as string[]).map((w, i) => (
                    <li key={i} className="text-xs text-purple-800">· {w}</li>
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
