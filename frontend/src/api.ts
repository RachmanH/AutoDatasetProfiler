import axios from 'axios'
import type { UploadResponse, AnalyzeResponse, HistoryItem } from './types'

const api = axios.create({ baseURL: '/api', timeout: 180_000 })

export async function uploadDataset(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadResponse>('/datasets/upload', form)
  return data
}

export async function analyzeDataset(
  dataset_id: string,
  target_col: string | null,
): Promise<AnalyzeResponse> {
  const { data } = await api.post<AnalyzeResponse>('/datasets/analyze', {
    dataset_id,
    target_col,
  })
  return data
}

export async function getLLMUnderstanding(
  dataset_id: string,
  target_col: string | null,
  meta: object,
) {
  const { data } = await api.post('/llm/dataset-understanding', {
    dataset_id,
    target_col,
    meta,
  })
  return data
}

export async function getResearchSuggestions(
  dataset_id: string,
  target_col: string | null,
  meta: object,
) {
  const { data } = await api.post('/research/suggestions', {
    dataset_id,
    target_col,
    meta,
  })
  return data
}

export async function generateResearchPRD(payload: {
  dataset_id: string
  selected_title: string
  selected_task: string
  background: string
  research_questions: string[]
  target_col?: string | null
  meta?: object
}) {
  const { data } = await api.post('/research/generate-prd', payload)
  return data
}

export async function getHistory(): Promise<HistoryItem[]> {
  const { data } = await api.get<{ history: HistoryItem[] }>('/datasets/history')
  return data.history
}

export function exportJsonUrl(dataset_id: string, analysis_id: number) {
  return `/api/datasets/${dataset_id}/export/json?analysis_id=${analysis_id}`
}

export function exportCsvUrl(dataset_id: string, analysis_id: number) {
  return `/api/datasets/${dataset_id}/export/csv?analysis_id=${analysis_id}`
}
