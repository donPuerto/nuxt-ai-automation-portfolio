export type TranscriptionFileStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'deleted'

export type TranscriptionFileRow = {
  id: string
  user_id: string
  file_name: string
  mime_type: string | null
  file_size_bytes: number | null
  source_type: string
  source_url: string | null
  drive_file_id: string | null
  drive_web_view_link: string | null
  drive_download_link: string | null
  drive_folder_id: string | null
  status: TranscriptionFileStatus
  transcriber: 'assemblyai' | 'deepgram' | 'whisper'
  transcription: string | null
  summary: string | null
  highlights: unknown
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export type TranscriptionRunRow = {
  id: string
  transcription_file_id: string
  user_id: string
  job_id: string
  callback_url: string | null
  transcriber: 'assemblyai' | 'deepgram' | 'whisper'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  source_url: string | null
  started_at: string | null
  finished_at: string | null
  error_message: string | null
  result_payload: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

export const transcriptionFileSelect = 'id,user_id,file_name,mime_type,file_size_bytes,source_type,source_url,drive_file_id,drive_web_view_link,drive_download_link,drive_folder_id,status,transcriber,transcription,summary,highlights,error_message,metadata,created_at,updated_at,deleted_at'

export const mapHighlights = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value
    .map(item => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean)
}
