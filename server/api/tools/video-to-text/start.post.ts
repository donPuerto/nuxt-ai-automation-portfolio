import { getVideoToTextJob, setVideoToTextJob } from '../../../utils/video-to-text-jobs'

type StartVideoToTextRequest = {
  url?: string
  transcriber?: 'assemblyai' | 'deepgram' | 'whisper'
}

const isPublicOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin)
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
  }
  catch {
    return false
  }
}

const detectSource = (url: string) => {
  const normalized = url.toLowerCase()

  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
    return 'youtube'
  }

  if (normalized.includes('drive.google.com')) {
    return 'gdrive'
  }

  return 'social'
}

const buildConfiguredCallbackUrl = (callbackBaseUrl: string, jobId: string) => {
  try {
    const url = new URL(callbackBaseUrl)
    url.searchParams.set('jobId', jobId)
    return url.toString()
  }
  catch {
    return callbackBaseUrl
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody<StartVideoToTextRequest>(event)
  const trimmedUrl = body?.url?.trim() ?? ''
  const transcriber = body?.transcriber && ['assemblyai', 'deepgram', 'whisper'].includes(body.transcriber)
    ? body.transcriber
    : 'assemblyai'

  if (!trimmedUrl) {
    return {
      ok: false,
      message: 'A video URL is required.',
    }
  }

  if (!config.videoToTextWebhookUrl || !config.videoToTextApiKey) {
    return {
      ok: false,
      message: 'Video to text webhook configuration is missing.',
    }
  }

  const requestOrigin = getRequestURL(event).origin
  const siteUrl = config.public.siteUrl?.trim() || requestOrigin
  const jobId = crypto.randomUUID()
  const configuredCallbackUrl = config.videoToTextCallbackUrl?.trim()
    ? buildConfiguredCallbackUrl(config.videoToTextCallbackUrl.trim(), jobId)
    : ''
  const fallbackCallbackUrl = isPublicOrigin(siteUrl)
    ? `${siteUrl.replace(/\/$/, '')}/api/tools/video-to-text/callback/${jobId}`
    : ''
  const now = new Date().toISOString()
  const source = detectSource(trimmedUrl)
  const callbackUrl = configuredCallbackUrl || fallbackCallbackUrl
  const callbackReachable = Boolean(callbackUrl)

  await setVideoToTextJob({
    id: jobId,
    status: 'processing',
    sourceUrl: trimmedUrl,
    source,
    transcriber,
    createdAt: now,
    updatedAt: now,
  })

  try {
    const response = await $fetch.raw<{ message?: string }>(config.videoToTextWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.videoToTextApiKey,
      },
      ignoreResponseError: true,
      body: {
        job_id: jobId,
        url: trimmedUrl,
        source: 'auto',
        transcriber,
        gdrive_file_id: '',
        callback_url: callbackUrl,
      },
    })

    if (!response.ok) {
      const message
        = typeof response._data === 'object'
          && response._data !== null
          && 'message' in response._data
          && typeof response._data.message === 'string'
          ? response._data.message
          : `Video to text webhook returned ${response.status}.`

      await setVideoToTextJob({
        id: jobId,
        status: 'failed',
        sourceUrl: trimmedUrl,
        source,
        transcriber,
        createdAt: now,
        updatedAt: new Date().toISOString(),
        error: message,
      })

      return {
        ok: false,
        message,
      }
    }

    const existingJob = await getVideoToTextJob(jobId)

    if (existingJob) {
      await setVideoToTextJob({
        ...existingJob,
        updatedAt: new Date().toISOString(),
      })
    }

    return {
      ok: true,
      jobId,
      callbackReachable,
      callbackUrl,
      message: callbackReachable
        ? 'Transcription workflow started. The transcript will appear below when processing finishes.'
        : 'Transcription started, but callback delivery needs a public callback URL.',
    }
  }
  catch (error) {
    const message
      = error instanceof Error
        ? error.message
        : 'The transcription workflow could not be started.'

    await setVideoToTextJob({
      id: jobId,
      status: 'failed',
      sourceUrl: trimmedUrl,
      source,
      transcriber,
      createdAt: now,
      updatedAt: new Date().toISOString(),
      error: message,
    })

    return {
      ok: false,
      message,
    }
  }
})
