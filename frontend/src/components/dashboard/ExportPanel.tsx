import { useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface Props {
  datasetId: string
  analysisId: string
  filename: string
}

export default function ExportPanel({ datasetId, analysisId, filename }: Props) {
  const [exportingPdf, setExportingPdf] = useState(false)

  const jsonUrl = `/api/datasets/${datasetId}/export/json?analysis_id=${analysisId}`
  const csvUrl = `/api/datasets/${datasetId}/export/csv?analysis_id=${analysisId}`

  async function handlePdfExport() {
    setExportingPdf(true)
    try {
      const target = document.getElementById('dashboard-content')
      if (!target) return

      const canvas = await html2canvas(target, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width

      let y = 0
      while (y < imgH) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
        y += pageH
      }

      pdf.save(`${filename.replace(/\.[^.]+$/, '')}-analisis.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-slate-800">Ekspor Hasil</h3>
      <div className="flex flex-wrap gap-3">
        <a
          href={jsonUrl}
          download
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ↓ Unduh JSON
        </a>
        <a
          href={csvUrl}
          download
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ↓ Unduh CSV
        </a>
        <button
          onClick={handlePdfExport}
          disabled={exportingPdf}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
        >
          {exportingPdf ? 'Membuat PDF...' : '↓ Unduh PDF'}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        PDF mengekspor tampilan dashboard yang sedang aktif.
      </p>
    </div>
  )
}
