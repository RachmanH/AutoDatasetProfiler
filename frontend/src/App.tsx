import { useState, useEffect } from 'react'
import type { Step, UploadResponse, AnalyzeResponse } from './types'

const SS_STEP = 'adp_step'
const SS_UPLOAD = 'adp_upload'
const SS_ANALYZE = 'adp_analyze'

function ssGet<T>(key: string): T | null {
  try {
    const v = sessionStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function ssSet(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded — skip persistence
  }
}

export default function App() {
  const [step, setStep] = useState<Step>(() => ssGet<Step>(SS_STEP) ?? 'landing')
  const [uploadData, setUploadData] = useState<UploadResponse | null>(() => ssGet(SS_UPLOAD))
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(() => ssGet(SS_ANALYZE))

  useEffect(() => { ssSet(SS_STEP, step) }, [step])
  useEffect(() => { ssSet(SS_UPLOAD, uploadData) }, [uploadData])
  useEffect(() => { ssSet(SS_ANALYZE, analyzeData) }, [analyzeData])

  function handleReset() {
    setUploadData(null)
    setAnalyzeData(null)
    setStep('landing')
  }

  function handleUploaded(data: UploadResponse) {
    setUploadData(data)
    setStep('preview')
  }

  function handleAnalyzed(data: AnalyzeResponse) {
    setAnalyzeData(data)
    setStep('results')
  }

  // Placeholder renders — komponen akan ditambah per commit
  const renders: Record<Step, JSX.Element> = {
    landing: (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
        <h1 className="text-4xl font-bold text-slate-800">AutoDataset Profiler</h1>
        <p className="text-slate-500 text-lg">Analisis dataset otomatis berbasis AI</p>
        <button
          onClick={() => setStep('upload')}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Mulai Analisis
        </button>
      </div>
    ),
    upload: <div className="p-8 text-center text-slate-400">Upload page — segera hadir</div>,
    preview: <div className="p-8 text-center text-slate-400">Preview page — segera hadir</div>,
    results: <div className="p-8 text-center text-slate-400">Results page — segera hadir</div>,
    research: <div className="p-8 text-center text-slate-400">Research page — segera hadir</div>,
  }

  // Expose handlers via data attrs for child components (temporary)
  void handleUploaded
  void handleAnalyzed
  void handleReset

  return <>{renders[step]}</>
}
