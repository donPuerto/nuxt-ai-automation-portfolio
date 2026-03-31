export type VideoToTextJobStatus =
  | 'processing'
  | 'completed'
  | 'failed'

export interface VideoToTextJobRecord {
  id: string
  status: VideoToTextJobStatus
  sourceUrl: string
  source: string
  transcriber: string
  createdAt: string
  updatedAt: string
  transcription?: string
  wordCount?: number
  error?: string
}

const getJobKey = (jobId: string) => `video-to-text:${jobId}`

export const getVideoToTextJob = async (jobId: string) => {
  const storage = useStorage('data')
  return await storage.getItem<VideoToTextJobRecord>(getJobKey(jobId))
}

export const setVideoToTextJob = async (job: VideoToTextJobRecord) => {
  const storage = useStorage('data')
  await storage.setItem(getJobKey(job.id), job)
}
