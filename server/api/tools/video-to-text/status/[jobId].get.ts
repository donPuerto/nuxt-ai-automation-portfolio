import { getVideoToTextJob, setVideoToTextJob } from '../../../../utils/video-to-text-jobs'
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '../../../../utils/supabase-admin'

type SupabaseTranscriptionFileStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'deleted'

type SupabaseTranscriptionFileSnapshot = {
  current_job_id: string | null
  status: SupabaseTranscriptionFileStatus
  source_url: string | null
  transcriber: string | null
  transcription: string | null
  summary: string | null
  highlights: string[] | null
  error_message: string | null
  started_at: string | null
  created_at: string | null
  updated_at: string | null
}

const mapSupabaseStatusToJobStatus = (status: SupabaseTranscriptionFileStatus) => {
  if (status === 'completed' || status === 'failed') {
    return status
  }

  if (status === 'cancelled') {
    return 'failed' as const
  }

  return 'processing' as const
}

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

  if (hasSupabaseAdminConfig(event)) {
    try {
      const supabase = getSupabaseAdmin(event)
      const { data: fileRow, error } = await supabase
        .from('transcription_files')
        .select('current_job_id,status,source_url,transcriber,transcription,summary,highlights,error_message,started_at,created_at,updated_at')
        .eq('current_job_id', jobId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && fileRow) {
        const file = fileRow as SupabaseTranscriptionFileSnapshot
        const fallbackJob = {
          id: jobId,
          status: mapSupabaseStatusToJobStatus(file.status),
          sourceUrl: file.source_url || '',
          source: 'upload',
          transcriber: file.transcriber || 'assemblyai',
          transcription: file.transcription || undefined,
          summary: file.summary || undefined,
          highlights: Array.isArray(file.highlights) ? file.highlights : [],
          error: file.error_message || undefined,
          createdAt: file.started_at || file.created_at || new Date().toISOString(),
          updatedAt: file.updated_at || new Date().toISOString(),
        }

        await setVideoToTextJob(fallbackJob, event)

        return {
          ok: true,
          job: fallbackJob,
        }
      }
    }
    catch (error) {
      console.warn('video-to-text status supabase fallback failed', error)
    }
  }

  return {
    ok: false,
    message: 'Transcription job not found.',
  }
})
