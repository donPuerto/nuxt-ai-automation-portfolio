import { getVideoToTextJob, setVideoToTextJob } from '../../../../utils/video-to-text-jobs'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  })

  const jobId = getRouterParam(event, 'jobId')

  if (!jobId) {
    return {
      ok: false,
      message: 'A job id is required.',
    }
  }

  const config = useRuntimeConfig(event)
  const callbackBaseUrl = config.videoToTextCallbackUrl?.trim()
  const requestOrigin = getRequestURL(event).origin
  const skipProxy = getHeader(event, 'x-video-to-text-proxy') === '1'
  const localJob = await getVideoToTextJob(jobId, event)
  let proxiedJob: typeof localJob | null = null

  if (!skipProxy && callbackBaseUrl) {
    try {
      const callbackOrigin = new URL(callbackBaseUrl).origin

      if (callbackOrigin && callbackOrigin !== requestOrigin) {
        const proxied = await $fetch<{ ok?: boolean, job?: typeof localJob }>(
          `${callbackOrigin}/api/tools/video-to-text/status/${jobId}`,
          {
            headers: {
              'x-video-to-text-proxy': '1',
            },
            query: {
              t: Date.now(),
            },
          },
        )

        if (proxied?.ok && proxied?.job) {
          proxiedJob = proxied.job
        }
      }
    }
    catch (error) {
      console.warn('video-to-text status proxy failed', error)
    }
  }

  if (proxiedJob && (!localJob || localJob.status === 'processing')) {
    // Keep local state in sync when callback was processed remotely (workers origin).
    await setVideoToTextJob(proxiedJob, event)

    return {
      ok: true,
      job: proxiedJob,
    }
  }

  if (localJob) {
    return {
      ok: true,
      job: localJob,
    }
  }

  if (proxiedJob) {
    return {
      ok: true,
      job: proxiedJob,
    }
  }

  return {
    ok: false,
    message: 'Transcription job not found.',
  }
})
