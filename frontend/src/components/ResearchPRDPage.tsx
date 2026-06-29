import { useState, useEffect } from 'react'
import { getResearchSuggestions, generateResearchPRD } from '../api'
import type { AnalyzeResponse } from '../types'

interface Props {
  analyzeData: AnalyzeResponse
  onBack: () => void
}

interface Suggestions {
  suggested_titles: string[]
  suggested_tasks: { task: string; reason: string }[]
  research_questions: string[]
}

export default function ResearchPRDPage({ analyzeData, onBack }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [loadingSugg, setLoadingSugg] = useState(false)
  const [suggError, setSuggError] = useState<string | null>(null)

  const [selectedTitle, setSelectedTitle] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [background, setBackground] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])

  const [prd, setPrd] = useState<string | null>(null)
  const [loadingPrd, setLoadingPrd] = useState(false)
  const [prdError, setPrdError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  async function fetchSuggestions() {
    setLoadingSugg(true)
    setSuggError(null)
    try {
      const res = await getResearchSuggestions(
        analyzeData.dataset_id,
        analyzeData.task_suggestion.suggested_task === 'clustering_candidate' ? null : null,
        analyzeData.meta,
      )
      setSuggestions(res.suggestions)
      if (res.suggestions.suggested_titles?.[0]) setSelectedTitle(res.suggestions.suggested_titles[0])
      if (res.suggestions.suggested_tasks?.[0]) setSelectedTask(res.suggestions.suggested_tasks[0].task)
    } catch {
      setSuggError('Gagal mengambil saran penelitian. Pastikan LLM API tersedia.')
    } finally {
      setLoadingSugg(false)
    }
  }

  function toggleQuestion(q: string) {
    setSelectedQuestions((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
    )
  }

  async function handleGeneratePRD() {
    if (!selectedTitle || !selectedTask) return
    setPrdError(null)
    setLoadingPrd(true)
    try {
      const res = await generateResearchPRD({
        dataset_id: analyzeData.dataset_id,
        selected_title: selectedTitle,
        selected_task: selectedTask,
        background: background || 'Belum diisi.',
        research_questions: selectedQuestions.length ? selectedQuestions : (suggestions?.research_questions ?? []),
        meta: analyzeData.meta,
      })
      setPrd(res.prd_markdown)
    } catch {
      setPrdError('Gagal generate PRD. Coba lagi.')
    } finally {
      setLoadingPrd(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 transition">← Kembali</button>
          <h2 className="text-2xl font-bold text-slate-800">Research PRD</h2>
        </div>

        {/* Loading suggestions */}
        {loadingSugg && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 animate-pulse">
            Mengambil saran penelitian dari LLM...
          </div>
        )}

        {suggError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {suggError}
          </div>
        )}

        {suggestions && !prd && (
          <>
            {/* Title selection */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-700">Judul Penelitian</h3>
              <div className="space-y-2 mb-3">
                {suggestions.suggested_titles.map((t) => (
                  <label key={t} className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${selectedTitle === t ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="title" value={t} checked={selectedTitle === t} onChange={() => setSelectedTitle(t)} className="mt-0.5 accent-blue-600" />
                    <span className="text-sm text-slate-700">{t}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="Atau ketik judul sendiri..."
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Task selection */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-700">Task Machine Learning</h3>
              <div className="space-y-2">
                {suggestions.suggested_tasks.map((t) => (
                  <label key={t.task} className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${selectedTask === t.task ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="task" value={t.task} checked={selectedTask === t.task} onChange={() => setSelectedTask(t.task)} className="mt-0.5 accent-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.task}</p>
                      <p className="text-xs text-slate-500">{t.reason}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-700">Latar Belakang (opsional)</h3>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Tuliskan latar belakang penelitian Anda..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Research questions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-700">Pertanyaan Penelitian</h3>
              <div className="space-y-2">
                {suggestions.research_questions.map((q) => (
                  <label key={q} className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${selectedQuestions.includes(q) ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={selectedQuestions.includes(q)} onChange={() => toggleQuestion(q)} className="mt-0.5 accent-green-600" />
                    <span className="text-sm text-slate-700">{q}</span>
                  </label>
                ))}
              </div>
            </div>

            {prdError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{prdError}</div>
            )}

            <button
              onClick={handleGeneratePRD}
              disabled={loadingPrd || !selectedTitle || !selectedTask}
              className="w-full rounded-xl bg-purple-600 py-3.5 text-base font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition-colors"
            >
              {loadingPrd ? 'Membuat PRD...' : 'Generate Research PRD →'}
            </button>
          </>
        )}

        {/* PRD Result */}
        {prd && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-800">Research PRD</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(prd)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Salin
                </button>
                <button
                  onClick={() => setPrd(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Buat Ulang
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap p-6 text-sm text-slate-700 font-sans leading-relaxed overflow-x-auto">
              {prd}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
