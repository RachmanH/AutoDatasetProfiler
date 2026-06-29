import { useState, useEffect } from 'react'
import type { Step, UploadResponse, AnalyzeResponse } from './types'
import LandingPage from './components/LandingPage'
import UploadPage from './components/UploadPage'
import PreviewPage from './components/PreviewPage'
import ResultDashboard from './components/ResultDashboard'
import ResearchPRDPage from './components/ResearchPRDPage'
import HistoryPage from './components/HistoryPage'
import DarkModeToggle from './components/ui/DarkModeToggle'
import { useDarkMode } from './hooks/useDarkMode'

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
  const { dark, toggle } = useDarkMode()
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

  const placeholder = (label: string) => (
    <div className="min-h-screen flex items-center justify-center text-slate-400">{label} — segera hadir</div>
  )

  const renders: Record<Step, JSX.Element> = {
    landing: <LandingPage onStart={() => setStep('upload')} onHistory={() => setStep('history')} />,
    upload: <UploadPage onUploaded={handleUploaded} onBack={() => setStep('landing')} />,
    preview: uploadData
      ? <PreviewPage uploadData={uploadData} onAnalyzed={handleAnalyzed} onBack={() => setStep('upload')} />
      : placeholder('Preview page'),
    results: analyzeData
      ? <ResultDashboard data={analyzeData} onReset={handleReset} onResearch={() => setStep('research')} />
      : placeholder('Results page'),
    research: analyzeData
      ? <ResearchPRDPage analyzeData={analyzeData} onBack={() => setStep('results')} />
      : placeholder('Research page'),
    history: <HistoryPage onBack={() => setStep('landing')} />,
  }


  return (
    <>
      <div className="fixed top-3 right-3 z-50">
        <DarkModeToggle dark={dark} toggle={toggle} />
      </div>
      {renders[step]}
    </>
  )
}
