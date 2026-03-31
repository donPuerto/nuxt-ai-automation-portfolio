import { getVideoToTextJob } from '../../../../utils/video-to-text-jobs'

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

  const job = await getVideoToTextJob(jobId)

  if (!job) {
    return {
      ok: false,
      message: 'Transcription job not found.',
    }
  }

  return {
    ok: true,
    job,
  }
})
