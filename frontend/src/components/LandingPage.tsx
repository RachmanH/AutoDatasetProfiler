interface Props {
  onStart: () => void
  onHistory: () => void
}

const features = [
  {
    icon: '📊',
    title: 'Profiling Otomatis',
    desc: 'Deteksi tipe kolom, statistik deskriptif, dan kualitas data secara otomatis.',
  },
  {
    icon: '🤖',
    title: 'Insight berbasis LLM',
    desc: 'Pemahaman domain dataset, rekomendasi target, dan peringatan metodologi dari AI.',
  },
  {
    icon: '📈',
    title: 'Visualisasi EDA',
    desc: 'Histogram, boxplot, scatter plot, heatmap korelasi, dan chart interaktif.',
  },
  {
    icon: '⚙️',
    title: 'Preview Preprocessing',
    desc: 'Lihat before/after imputasi, encoding, scaling, dan penanganan outlier.',
  },
  {
    icon: '🎯',
    title: 'Saran ML Task',
    desc: 'Rekomendasi task machine learning otomatis berdasarkan karakteristik dataset.',
  },
  {
    icon: '📝',
    title: 'Research PRD',
    desc: 'Generate dokumen rencana penelitian lengkap dalam format Markdown.',
  },
]

export default function LandingPage({ onStart, onHistory }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          Didukung LLM · Analisis Instan
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
          AutoDataset
          <span className="text-blue-400"> Profiler</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Upload file CSV atau XLSX dan dapatkan analisis eksploratif data lengkap
          dalam hitungan detik — tanpa coding, tanpa setup.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onStart}
            className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40"
          >
            Mulai Analisis →
          </button>
          <button
            onClick={onHistory}
            className="rounded-xl border border-slate-600 px-8 py-3.5 text-base font-semibold hover:bg-slate-800 transition-colors"
          >
            Riwayat
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Mendukung CSV & XLSX · Maks 20 MB · Data tidak disimpan permanen
        </p>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center text-2xl font-bold text-slate-200">
          Apa yang bisa dilakukan?
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 hover:border-blue-500/40 transition-colors"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-600">
        AutoDataset Profiler · UAS Project · 2025
      </div>
    </div>
  )
}
