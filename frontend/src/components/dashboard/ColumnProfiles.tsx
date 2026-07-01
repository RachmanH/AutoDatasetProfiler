import { useState } from 'react'
import type { ColumnProfile } from '../../types'
import { TYPE_BADGE_COLOR } from '../../lib/badgeColors'

interface Props {
  profiles: ColumnProfile[]
}

export default function ColumnProfiles({ profiles }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('semua')

  const types = ['semua', ...Array.from(new Set(profiles.map((p) => p.detected_type)))]
  const filtered = profiles.filter((p) => {
    const matchSearch = p.column.toLowerCase().includes(search.toLowerCase())
    const matchType = filter === 'semua' || p.detected_type === filter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari kolom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="self-center text-sm text-slate-400 dark:text-slate-500">{filtered.length} kolom</span>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.column} className="card p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 break-all">{p.column}</h4>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLOR[p.detected_type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                {p.detected_type}
              </span>
            </div>

            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Unik</span><span className="font-medium">{p.unique_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing</span>
                <span className={`font-medium ${p.missing_percentage > 20 ? 'text-red-500 dark:text-red-400' : ''}`}>
                  {p.missing_count} ({p.missing_percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dtype</span><span className="font-mono text-xs">{p.dtype}</span>
              </div>
            </div>

            {p.stats && (
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Min</span><span>{p.stats.min}</span></div>
                <div className="flex justify-between"><span>Mean</span><span>{p.stats.mean}</span></div>
                <div className="flex justify-between"><span>Max</span><span>{p.stats.max}</span></div>
                <div className="flex justify-between"><span>Std</span><span>{p.stats.std}</span></div>
              </div>
            )}

            {p.sample_values.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Contoh nilai:</p>
                <div className="flex flex-wrap gap-1">
                  {p.sample_values.slice(0, 3).map((v, i) => (
                    <span key={i} className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                      {String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
