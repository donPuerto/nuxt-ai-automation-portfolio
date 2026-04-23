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

const isValidVideoUrlForTranscription = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl)
    const hostname = url.hostname.toLowerCase()
    const pathname = url.pathname.toLowerCase()

    if (hostname.includes('youtube.com')) {
      const videoIdParam = [...url.searchParams.entries()]
        .find(([key, value]) => key.toLowerCase() === 'v' && value.trim())?.[1]
      const hasVideoIdQuery = Boolean(videoIdParam)
      const hasEmbedOrShortsPath = pathname.startsWith('/embed/')
        || pathname.startsWith('/shorts/')
        || pathname.startsWith('/live/')
      return hasVideoIdQuery || hasEmbedOrShortsPath
    }

    if (hostname.includes('youtu.be')) {
      return pathname.length > 1
    }

    return true
  }
  catch {
    return false
  }
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

  if (!isValidVideoUrlForTranscription(trimmedUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please provide a valid video URL. For YouTube, paste the full link with a specific video id.',
    })
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
  }, event)

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
      }, event)

      return {
        ok: false,
        message,
      }
    }

    const existingJob = await getVideoToTextJob(jobId, event)

    if (existingJob) {
      await setVideoToTextJob({
        ...existingJob,
        updatedAt: new Date().toISOString(),
      }, event)
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
    }, event)

    return {
      ok: false,
      message,
    }
  }
})
