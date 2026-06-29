export type Step = 'landing' | 'upload' | 'preview' | 'results' | 'research'

export interface DatasetMeta {
  dataset_id: string
  filename: string
  file_type: string
  row_count: number
  column_count: number
  file_size_kb: number
  columns: string[]
}

export interface UploadResponse {
  dataset_id: string
  meta: DatasetMeta
  preview: Record<string, unknown>[]
}

export interface ColumnStats {
  mean: number
  median: number
  std: number
  min: number
  max: number
}

export interface ColumnProfile {
  column: string
  dtype: string
  detected_type: string
  unique_count: number
  missing_count: number
  missing_percentage: number
  sample_values: unknown[]
  stats: ColumnStats | null
}

export interface DataQuality {
  total_cells: number
  missing_cells: number
  missing_percentage: number
  duplicate_rows: number
  duplicate_percentage: number
  id_like_columns: string[]
  constant_columns: string[]
  high_missing_columns: string[]
}

export interface TaskSuggestion {
  suggested_task: string
  task_label: string
  reason: string
  confidence: string
}

export interface PreprocessingStep {
  step: string
  column: string
  method: string
  before: unknown[]
  after: unknown[]
}

export interface ChartData {
  type: string
  column?: string
  title: string
  data: Record<string, unknown>[]
  [key: string]: unknown
}

export interface AnalyzeResponse {
  dataset_id: string
  analysis_id: number
  meta: DatasetMeta
  profiles: ColumnProfile[]
  data_quality: DataQuality
  task_suggestion: TaskSuggestion
  charts: ChartData[]
  preprocessing: PreprocessingStep[]
  llm_understanding: Record<string, unknown> | null
}

export interface HistoryItem {
  analysis_id: number
  dataset_id: string
  filename: string
  target_column: string | null
  created_at: string
}
