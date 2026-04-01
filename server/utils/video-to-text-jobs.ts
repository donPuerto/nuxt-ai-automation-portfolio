import type { H3Event } from 'h3'

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

type VideoToTextJobsKv = {
  get(key: string, type: 'json'): Promise<VideoToTextJobRecord | null>
  put(key: string, value: string): Promise<void>
}

const getVideoToTextJobsKv = (event?: H3Event): VideoToTextJobsKv | undefined =>
  event?.context.cloudflare?.env?.VIDEO_TO_TEXT_JOBS as VideoToTextJobsKv | undefined

export const getVideoToTextJob = async (jobId: string, event?: H3Event) => {
  const key = getJobKey(jobId)
  const jobsKv = getVideoToTextJobsKv(event)

  if (jobsKv) {
    const job = await jobsKv.get(key, 'json')
    return job as VideoToTextJobRecord | null
  }

  const storage = useStorage('data')
  return await storage.getItem<VideoToTextJobRecord>(key)
}

export const setVideoToTextJob = async (job: VideoToTextJobRecord, event?: H3Event) => {
  const key = getJobKey(job.id)
  const jobsKv = getVideoToTextJobsKv(event)

  if (jobsKv) {
    await jobsKv.put(key, JSON.stringify(job))
    return
  }

  const storage = useStorage('data')
  await storage.setItem(key, job)
}
