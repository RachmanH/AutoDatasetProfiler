import type { AnalyzeResponse } from '../../types'

interface Props {
  data: AnalyzeResponse
}

const TYPE_COLOR: Record<string, string> = {
  numeric: 'bg-blue-100 text-blue-700',
  categorical: 'bg-purple-100 text-purple-700',
  datetime: 'bg-green-100 text-green-700',
  boolean: 'bg-yellow-100 text-yellow-700',
  text: 'bg-orange-100 text-orange-700',
  id_like: 'bg-slate-100 text-slate-600',
  constant: 'bg-red-100 text-red-600',
}

export default function OverviewStats({ data }: Props) {
  const { meta, data_quality, profiles } = data

  const typeCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.detected_type] = (acc[p.detected_type] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    { label: 'Total Baris', value: meta.row_count.toLocaleString() },
    { label: 'Total Kolom', value: meta.column_count },
    { label: 'Missing (%)', value: `${data_quality.missing_percentage.toFixed(1)}%` },
    { label: 'Duplikat', value: data_quality.duplicate_rows.toLocaleString() },
    { label: 'Ukuran File', value: `${meta.file_size_kb.toFixed(1)} KB` },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Column type breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Distribusi Tipe Kolom</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span
              key={type}
              className={`rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLOR[type] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {type} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Data quality warnings */}
      {(data_quality.high_missing_columns.length > 0 ||
        data_quality.constant_columns.length > 0 ||
        data_quality.id_like_columns.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-amber-800">⚠️ Peringatan Kualitas Data</h3>
          <ul className="space-y-1 text-sm text-amber-700">
            {data_quality.high_missing_columns.map((c) => (
              <li key={c}>· Kolom <code className="font-mono">{c}</code> memiliki missing values &gt; 50%</li>
            ))}
            {data_quality.constant_columns.map((c) => (
              <li key={c}>· Kolom <code className="font-mono">{c}</code> bernilai konstan (tidak informatif)</li>
            ))}
            {data_quality.id_like_columns.map((c) => (
              <li key={c}>· Kolom <code className="font-mono">{c}</code> terdeteksi sebagai ID (pertimbangkan untuk dihapus)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
