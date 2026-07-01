import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
  CartesianGrid,
} from 'recharts'
import type { ChartData } from '../../types'

interface Props {
  charts: ChartData[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function EDACharts({ charts }: Props) {
  if (!charts.length) {
    return <p className="text-slate-400 text-center py-20">Tidak ada chart tersedia.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {charts.map((chart, i) => (
        <ChartCard key={i} chart={chart} colorIdx={i} />
      ))}
    </div>
  )
}

function ChartCard({ chart, colorIdx }: { chart: ChartData; colorIdx: number }) {
  const color = COLORS[colorIdx % COLORS.length]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="mb-4 text-sm text-slate-700">{chart.title}</h4>
      {chart.type === 'histogram' && <HistogramChart data={chart.data as {name:string,jumlah:number}[]} color={color} />}
      {chart.type === 'bar' && <BarChartComp data={chart.data as {name:string,jumlah:number}[]} color={color} />}
      {chart.type === 'pie' && <PieChartComp data={chart.data as {name:string,value:number}[]} />}
      {chart.type === 'boxplot' && <BoxplotComp data={chart.data as BoxRow[]} color={color} />}
      {chart.type === 'scatter' && <ScatterComp data={chart.data as {x:number,y:number}[]} chart={chart} color={color} />}
      {chart.type === 'grouped_bar' && <BarChartComp data={chart.data as {name:string,rata_rata:number}[]} color={color} valueKey="rata_rata" />}
      {chart.type === 'heatmap' && <HeatmapComp data={chart.data as HeatRow[]} columns={(chart.columns as string[]) ?? []} />}
    </div>
  )
}

function HistogramChart({ data, color }: { data: {name:string,jumlah:number}[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="jumlah" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function BarChartComp({ data, color, valueKey = 'jumlah' }: { data: Record<string,unknown>[]; color: string; valueKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
        <Tooltip />
        <Bar dataKey={valueKey} fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function PieChartComp({ data }: { data: {name:string,value:number}[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

type BoxRow = { name: string; min: number; q1: number; median: number; q3: number; max: number }

function BoxplotComp({ data, color }: { data: BoxRow[]; color: string }) {
  // Render boxplot sebagai custom bar (Recharts tidak punya boxplot native)
  const row = data[0]
  if (!row) return null
  const items = [
    { label: 'Min', value: row.min },
    { label: 'Q1', value: row.q1 },
    { label: 'Median', value: row.median },
    { label: 'Q3', value: row.q3 },
    { label: 'Max', value: row.max },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={items}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ScatterComp({ data, chart, color }: { data: {x:number,y:number}[]; chart: ChartData; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="x" name={String(chart.x_col ?? 'x')} tick={{ fontSize: 11 }} />
        <YAxis dataKey="y" name={String(chart.y_col ?? 'y')} tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter data={data} fill={color} opacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

type HeatRow = { x: string; y: string; value: number }

function HeatmapComp({ data, columns }: { data: HeatRow[]; columns: string[] }) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)))

  function cellColor(val: number) {
    const abs = Math.abs(val) / (max || 1)
    if (val >= 0) return `rgba(59,130,246,${0.1 + abs * 0.8})`
    return `rgba(239,68,68,${0.1 + abs * 0.8})`
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-1" />
            {columns.map((c) => <th key={c} className="p-1 text-slate-500 max-w-[60px] truncate">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {columns.map((row) => (
            <tr key={row}>
              <td className="p-1 font-medium text-slate-500 max-w-[60px] truncate pr-2">{row}</td>
              {columns.map((col) => {
                const cell = data.find((d) => d.x === col && d.y === row)
                const val = cell?.value ?? 0
                return (
                  <td key={col} title={`${row} × ${col}: ${val}`}
                    className="p-1 text-center rounded"
                    style={{ backgroundColor: cellColor(val), minWidth: 36 }}>
                    {val.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
