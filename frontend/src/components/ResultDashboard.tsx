import { useState } from 'react'
import type { AnalyzeResponse } from '../types'
import OverviewStats from './dashboard/OverviewStats'
import ColumnProfiles from './dashboard/ColumnProfiles'
import EDACharts from './dashboard/EDACharts'
import TaskSuggestion from './dashboard/TaskSuggestion'
import PreprocessingPreviews from './dashboard/PreprocessingPreviews'
import ColumnComparison from './dashboard/ColumnComparison'

interface Props {
  data: AnalyzeResponse
  onReset: () => void
  onResearch: () => void
  onRetarget: (targetCol: string) => Promise<void>
}

const TABS = ['Ringkasan', 'Profil Kolom', 'Chart EDA', 'Preprocessing', 'Task ML', 'Perbandingan']

export default function ResultDashboard({ data, onReset, onResearch, onRetarget }: Props) {
  const [tab, setTab] = useState('Ringkasan')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Hasil Analisis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{data.meta.filename}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onResearch}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            Research PRD →
          </button>
          <button
            onClick={onReset}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Dataset Baru
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 overflow-x-auto">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div id="dashboard-content" className="mx-auto max-w-6xl px-6 py-8">
        {tab === 'Ringkasan' && <OverviewStats data={data} />}
        {tab === 'Profil Kolom' && <ColumnProfiles profiles={data.profiles} />}
        {tab === 'Chart EDA' && <EDACharts charts={data.charts} />}
        {tab === 'Preprocessing' && <PreprocessingPreviews steps={data.preprocessing} />}
        {tab === 'Task ML' && <TaskSuggestion data={data} onRetarget={onRetarget} />}
        {tab === 'Perbandingan' && <ColumnComparison profiles={data.profiles} charts={data.charts} />}
      </div>
    </div>
  )
}
