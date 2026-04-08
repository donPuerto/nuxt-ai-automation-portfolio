export type ChatFileStatus = 'ready' | 'uploading' | 'processing' | 'error'

export interface ChatFileWithStatus {
  id: string
  file: File
  previewUrl?: string
  status: ChatFileStatus
  error?: string
}
