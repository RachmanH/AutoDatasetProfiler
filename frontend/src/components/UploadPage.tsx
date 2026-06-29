import { useState, useRef, DragEvent } from 'react'
import { uploadDataset } from '../api'
import type { UploadResponse } from '../types'

interface Props {
  onUploaded: (data: UploadResponse) => void
  onBack: () => void
}

const ACCEPTED = ['.csv', '.xlsx']
const MAX_MB = 20

export default function UploadPage({ onUploaded, onBack }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) return 'Format tidak didukung. Gunakan CSV atau XLSX.'
    if (file.size > MAX_MB * 1024 * 1024) return `Ukuran file melebihi ${MAX_MB} MB.`
    return null
  }

  async function handleFile(file: File) {
    const err = validate(file)
    if (err) { setError(err); return }

    setError(null)
    setLoading(true)
    try {
      const data = await uploadDataset(file)
      onUploaded(data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Gagal mengupload file. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="mb-6 text-sm text-slate-500 hover:text-slate-800 transition">
          ← Kembali
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Dataset</h2>
        <p className="text-slate-500 text-sm mb-8">Format CSV atau XLSX, maksimal {MAX_MB} MB.</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors
            ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-100'}
            ${loading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <div className="text-4xl mb-4">📂</div>
          {loading ? (
            <p className="text-indigo-600 font-medium animate-pulse">Mengupload file...</p>
          ) : (
            <>
              <p className="text-slate-600 font-medium">Drag & drop file di sini</p>
              <p className="text-slate-400 text-sm mt-1">atau klik untuk memilih file</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Data diproses di server lokal dan tidak dikirim ke pihak ketiga.
        </p>
      </div>
    </div>
  )
}
