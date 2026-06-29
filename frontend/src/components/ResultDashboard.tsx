import { useState } from 'react'
import type { AnalyzeResponse } from '../types'
import OverviewStats from './dashboard/OverviewStats'
import ColumnProfiles from './dashboard/ColumnProfiles'

interface Props {
  data: AnalyzeResponse
  onReset: () => void
  onResearch: () => void
}

const TABS = ['Ringkasan', 'Profil Kolom', 'Chart EDA', 'Preprocessing', 'Task ML']

export default function ResultDashboard({ data, onReset, onResearch }: Props) {
  const [tab, setTab] = useState('Ringkasan')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Hasil Analisis</h1>
          <p className="text-sm text-slate-500">{data.meta.filename}</p>
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
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Dataset Baru
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6 overflow-x-auto">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {tab === 'Ringkasan' && <OverviewStats data={data} />}
        {tab === 'Profil Kolom' && <ColumnProfiles profiles={data.profiles} />}
        {tab === 'Chart EDA' && (
          <div className="text-center text-slate-400 py-20">Chart EDA — segera hadir di commit berikutnya</div>
        )}
        {tab === 'Preprocessing' && (
          <div className="text-center text-slate-400 py-20">Preview Preprocessing — segera hadir</div>
        )}
        {tab === 'Task ML' && (
          <div className="text-center text-slate-400 py-20">Saran Task ML — segera hadir</div>
        )}
      </div>
    </div>
  )
}
