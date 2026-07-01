import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { ColumnProfile, ChartData } from '../../types'

interface Props {
  profiles: ColumnProfile[]
  charts: ChartData[]
}

const COLORS = ['#6366f1', '#8b5cf6']

export default function ColumnComparison({ profiles, charts }: Props) {
  const cols = profiles.map((p) => p.column)
  const [colA, setColA] = useState(cols[0] ?? '')
  const [colB, setColB] = useState(cols[1] ?? '')

  const profileA = profiles.find((p) => p.column === colA)
  const profileB = profiles.find((p) => p.column === colB)

  const chartA = charts.find((c) => c.column === colA && (c.type === 'histogram' || c.type === 'bar'))
  const chartB = charts.find((c) => c.column === colB && (c.type === 'histogram' || c.type === 'bar'))

  return (
    <div className="space-y-6">
      {/* Column pickers */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kolom A</label>
          <select
            value={colA}
            onChange={(e) => setColA(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {cols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kolom B</label>
          <select
            value={colB}
            onChange={(e) => setColB(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {cols.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {colA === colB && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800/50">
          Pilih dua kolom yang berbeda untuk perbandingan.
        </p>
      )}

      {colA !== colB && profileA && profileB && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats comparison */}
          <CompareCard profile={profileA} color={COLORS[0]} />
          <CompareCard profile={profileB} color={COLORS[1]} />

          {/* Chart comparison */}
          {chartA && (
            <div className="card p-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{colA} — distribusi</h4>
              <MiniBarChart data={chartA.data as {name:string,jumlah:number}[]} color={COLORS[0]} />
            </div>
          )}
          {chartB && (
            <div className="card p-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{colB} — distribusi</h4>
              <MiniBarChart data={chartB.data as {name:string,jumlah:number}[]} color={COLORS[1]} />
            </div>
          )}

          {/* Numeric stat comparison chart */}
          {profileA.stats && profileB.stats && (
            <div className="card p-5 md:col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Perbandingan statistik numerik</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Min', a: profileA.stats.min, b: profileB.stats.min },
                    { name: 'Mean', a: profileA.stats.mean, b: profileB.stats.mean },
                    { name: 'Max', a: profileA.stats.max, b: profileB.stats.max },
                    { name: 'Std', a: profileA.stats.std, b: profileB.stats.std },
                  ]}
                  margin={{ bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="a" name={colA} fill={COLORS[0]} radius={[3,3,0,0]} />
                  <Bar dataKey="b" name={colB} fill={COLORS[1]} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompareCard({ profile, color }: { profile: ColumnProfile; color: string }) {
  return (
    <div className="card p-5" style={{ borderColor: color + '60' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full" style={{ background: color }} />
        <h4 className="font-semibold text-slate-800 dark:text-slate-100">{profile.column}</h4>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">{profile.detected_type}</span>
      </div>
      <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
        <Row label="Unik" value={profile.unique_count.toLocaleString()} />
        <Row label="Missing" value={`${profile.missing_count} (${profile.missing_percentage.toFixed(1)}%)`} warn={profile.missing_percentage > 20} />
        <Row label="Dtype" value={profile.dtype} mono />
        {profile.stats && (
          <>
            <Row label="Min" value={String(profile.stats.min)} />
            <Row label="Mean" value={String(profile.stats.mean)} />
            <Row label="Max" value={String(profile.stats.max)} />
            <Row label="Std" value={String(profile.stats.std)} />
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, warn, mono }: { label: string; value: string; warn?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-medium ${warn ? 'text-red-500 dark:text-red-400' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function MiniBarChart({ data, color }: { data: {name:string,jumlah:number}[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="jumlah" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
