<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'
import MediaPreview from '@/components/ui/media/MediaPreview.vue'
import { toast } from 'vue-sonner'

type StartTranscriptionResult = {
  ok: boolean
  jobId?: string
  message: string
  callbackReachable?: boolean
  callbackUrl?: string
}

type ApiErrorLike = {
  data?: {
    message?: string
    statusMessage?: string
  }
  statusMessage?: string
  message?: string
}

type VideoToTextTranscriber = 'assemblyai' | 'deepgram' | 'whisper'
type VideoToTextSourceTab = 'url' | 'file'

type VideoToTextJob = {
  id: string
  status: 'processing' | 'completed' | 'failed' | 'cancelled'
  sourceUrl: string
  transcription?: string
  summary?: string
  highlights?: string[]
  transcriber: string
  source: string
  wordCount?: number
  createdAt: string
  updatedAt: string
  error?: string
}

type VideoToTextStatusResult = {
  ok: boolean
  job?: VideoToTextJob
}

type UploadedTranscriptionFile = {
  id: string
  file_name: string
  mime_type: string | null
  file_size_bytes: number | null
  source_url: string | null
  status: 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'deleted'
  transcriber: VideoToTextTranscriber
  transcription: string | null
  summary: string | null
  highlights: string[]
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

type UploadFileResult = {
  ok?: boolean
  file: UploadedTranscriptionFile | null
  jobId?: string
  message?: string
}

type SignedUploadInitResult = {
  bucket: string
  path: string
  fileId: string
  token: string
  maxFileSizeBytes: number
}

type UploadedFilesResult = {
  files: UploadedTranscriptionFile[]
}

type UploadedFilesSortOption = 'newest' | 'oldest'
type UploadedFilesStatusFilter = UploadedTranscriptionFile['status'] | 'all'

const MAX_UPLOAD_FILE_BYTES = 2 * 1024 * 1024 * 1024

const props = defineProps<{
  project: PortfolioKnowledgeProject
}>()

const supabaseConfigured = useSupabaseConfigured()
const supabase = supabaseConfigured ? useSupabaseClient() : null

const sourceUrl = ref('')
const sourceTab = ref<VideoToTextSourceTab>('url')
const loading = ref(false)
const jobId = ref('')
const status = ref<'idle' | 'processing' | 'completed' | 'failed' | 'cancelled'>('idle')
const transcript = ref('')
const transcriptSummary = ref('')
const summaryHighlights = ref<string[]>([])
const summaryDialogOpen = ref(false)
const summaryLoading = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const callbackReachable = ref(true)
const callbackUrl = ref('')
const transcriber = ref<VideoToTextTranscriber>('assemblyai')
const pollAttempts = ref(0)
const callbackPending = ref(false)
const statusSourceTab = ref<VideoToTextSourceTab | null>(null)
const activeJobSourceTab = ref<VideoToTextSourceTab | null>(null)
const lastCompletedSourceTab = ref<VideoToTextSourceTab | null>(null)
const selectedUploadFiles = ref<File[]>([])
const uploadingFile = ref(false)
const filesLoading = ref(false)
const transcriptionFiles = ref<UploadedTranscriptionFile[]>([])
const deletingFileId = ref('')
const bulkDeleting = ref(false)
const uploadedFilesSearch = ref('')
const uploadedFilesSort = ref<UploadedFilesSortOption>('newest')
const uploadedFilesStatusFilter = ref<UploadedFilesStatusFilter>('all')
const filesDialogOpen = ref(false)
const expandedFileId = ref('')
const selectedUploadedFileIds = ref<string[]>([])
const activeCombinedFileIds = ref<string[]>([])
const activeCombinedFileNames = ref<string[]>([])
const combinedCompletedCount = ref(0)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let scheduledPollAction: null | (() => Promise<void>) = null

const transcriberOptions = [
  {
    value: 'assemblyai',
    label: 'AssemblyAI',
    description: 'Higher accuracy for long-form video.',
  },
  {
    value: 'deepgram',
    label: 'Deepgram',
    description: 'Fastest for most web videos.',
  },
  {
    value: 'whisper',
    label: 'Whisper',
    description: 'Good for shorter files and direct uploads.',
  },
] as const

const uploadedFilesSortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const

const uploadedFilesStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'queued', label: 'Queued' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const canTranscribe = computed(() => {
  if (loading.value) {
    return false
  }

  if (sourceTab.value === 'file') {
    return selectedUploadFiles.value.length > 0 && !uploadingFile.value
  }

  return sourceUrl.value.trim().length > 0
})
const canCopyTranscript = computed(() => transcript.value.trim().length > 0)
const hasSummaryContent = computed(() => transcriptSummary.value.trim().length > 0 || summaryHighlights.value.length > 0)
const canCopySummary = computed(() => transcriptSummary.value.trim().length > 0 || summaryHighlights.value.length > 0)
const isCurrentTabStatus = computed(() => statusSourceTab.value === sourceTab.value)
const displayStatus = computed(() => {
  return isCurrentTabStatus.value ? status.value : 'idle'
})
const canStopTranscription = computed(() => isCurrentTabStatus.value && status.value === 'processing' && (!!jobId.value || loading.value || callbackPending.value))
const shouldShowTranscriptCard = computed(() => {
  return status.value === 'completed'
    && transcript.value.trim().length > 0
    && lastCompletedSourceTab.value === sourceTab.value
})
const filteredTranscriptionFiles = computed(() => {
  const query = uploadedFilesSearch.value.trim().toLowerCase()
  const statusFilter = uploadedFilesStatusFilter.value
  const filteredByStatus = statusFilter === 'all'
    ? [...transcriptionFiles.value]
    : transcriptionFiles.value.filter(file => file.status === statusFilter)

  const files = query
    ? filteredByStatus.filter((file) => {
        const haystack = [
          file.file_name,
          file.status,
          file.transcriber,
          file.mime_type ?? '',
          formatUploadedFileTimestamp(file.created_at),
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
    : filteredByStatus

  files.sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0

    return uploadedFilesSort.value === 'oldest'
      ? leftTime - rightTime
      : rightTime - leftTime
  })

  return files
})
const uploadedFilesSortLabel = computed(() => {
  return uploadedFilesSort.value === 'oldest' ? 'Oldest first' : 'Newest first'
})
const selectedUploadedFilesCount = computed(() => selectedUploadedFileIds.value.length)
const allFilteredFilesSelected = computed(() => {
  if (!filteredTranscriptionFiles.value.length) {
    return false
  }

  return filteredTranscriptionFiles.value.every(file => selectedUploadedFileIds.value.includes(file.id))
})
const someFilteredFilesSelected = computed(() => {
  if (!filteredTranscriptionFiles.value.length) {
    return false
  }

  return filteredTranscriptionFiles.value.some(file => selectedUploadedFileIds.value.includes(file.id))
})
const selectedUploadFileCount = computed(() => selectedUploadFiles.value.length)
const selectedUploadTotalBytes = computed(() => {
  return selectedUploadFiles.value.reduce((total, file) => total + file.size, 0)
})
const selectedUploadFileSummaries = computed(() => {
  return selectedUploadFiles.value.map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    size: file.size,
  }))
})
const isCombinedFileRun = computed(() => activeCombinedFileIds.value.length > 1)
const statusBadgeClass = computed(() => {
  if (displayStatus.value === 'completed') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  }

  if (displayStatus.value === 'processing') {
    return 'border-amber-400/30 bg-amber-400/10 text-amber-100'
  }

  if (displayStatus.value === 'failed') {
    return 'border-red-400/30 bg-red-400/10 text-red-200'
  }

  if (displayStatus.value === 'cancelled') {
    return 'border-zinc-400/30 bg-zinc-500/10 text-zinc-200'
  }

  return 'border-sky-400/30 bg-sky-500/10 text-sky-100'
})
const formattedTranscriptParagraphs = computed(() => {
  const normalizedTranscript = transcript.value
    .replace(/\r\n/g, '\n')
    .trim()

  if (!normalizedTranscript) {
    return []
  }

  const explicitParagraphs = normalizedTranscript
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  return explicitParagraphs.length ? explicitParagraphs : [normalizedTranscript]
})
const callbackNotice = computed(() => {
  if (!callbackPending.value || !isCurrentTabStatus.value) {
    return ''
  }

  return callbackUrl.value
    ? `Still waiting for n8n to POST the finished transcript back to ${callbackUrl.value}.`
    : 'Still waiting for n8n to POST the finished transcript back to the app.'
})
const sourceDescription = computed(() => {
  if (sourceTab.value === 'file') {
    return 'Upload an audio or video file, then start transcription with your selected transcriber.'
  }

  return 'Paste a YouTube or supported video URL, then start transcription.'
})
const shouldShowStatusMessage = computed(() => isCurrentTabStatus.value && statusMessage.value.trim().length > 0)
const formattedSummaryParagraphs = computed(() => {
  const normalizedSummary = transcriptSummary.value
    .replace(/\r\n/g, '\n')
    .trim()

  if (!normalizedSummary) {
    return []
  }

  return normalizedSummary
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
})

const getMaxPollAttempts = (provider: VideoToTextTranscriber) => {
  if (provider === 'deepgram') {
    return 15
  }

  if (provider === 'whisper') {
    return 20
  }

  return 50
}

const normalizeTranscriber = (value: string): VideoToTextTranscriber => {
  if (value === 'deepgram' || value === 'whisper') {
    return value
  }

  return 'assemblyai'
}

const clearPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
  scheduledPollAction = null
}

const scheduleNextPoll = (action: () => Promise<void>, delay = 3000) => {
  clearPolling()
  scheduledPollAction = action
  pollTimer = setTimeout(() => {
    void action()
  }, delay)
}

const getApiErrorMessage = (error: unknown) => {
  const candidate = error as ApiErrorLike | null
  const message
    = candidate?.data?.message
      || candidate?.data?.statusMessage
      || candidate?.statusMessage
      || candidate?.message
      || ''

  if (message.includes('Failed to fetch') || message.includes('<no response>')) {
    return `Upload failed before the server responded. Keep files under ${formatUploadLimit(MAX_UPLOAD_FILE_BYTES)} and try again.`
  }

  return message || 'We could not start the transcription workflow right now.'
}

const isEmptyTranscriptFailure = (file: UploadedTranscriptionFile) => {
  const message = file.error_message?.toLowerCase() ?? ''
  return message.includes('no transcript text was detected')
}

const getAuthHeaders = async () => {
  if (!supabase) {
    throw new Error('Please sign in to manage uploaded files.')
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('Please sign in to manage uploaded files.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

const formatUploadedFileSize = (bytes: number | null) => {
  if (!bytes || bytes <= 0) {
    return 'Unknown size'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatUploadLimit = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) {
    const gigabytes = bytes / (1024 * 1024 * 1024)
    return `${Number.isInteger(gigabytes) ? gigabytes : gigabytes.toFixed(1)}GB`
  }

  return `${Math.round(bytes / (1024 * 1024))}MB`
}

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const buildFileNameSortKey = (fileName: string) => {
  const normalized = fileName.trim().toLowerCase()
  const extensionMatch = normalized.match(/^(.*?)(\.[a-z0-9]+)?$/i)
  const baseName = extensionMatch?.[1] ?? normalized
  const extension = extensionMatch?.[2] ?? ''
  const partMatch = baseName.match(/(?:^|[\s._-])(part|pt|chunk|clip|segment)[\s._-]*(\d+)(?:$|[\s._-])/i)

  if (partMatch?.[2]) {
    const numericValue = Number.parseInt(partMatch[2], 10)
    const marker = partMatch[1] ?? ''
    const prefix = baseName.replace(new RegExp(`${escapeRegExp(partMatch[0])}$`, 'i'), '').trim()

    return {
      priority: 0,
      prefix,
      numericValue,
      marker,
      extension,
      fallback: normalized,
    }
  }

  const trailingNumberMatch = baseName.match(/^(.*?)(\d+)(?:$|[\s._-])/)
  if (trailingNumberMatch?.[2]) {
    return {
      priority: 1,
      prefix: trailingNumberMatch[1].trim(),
      numericValue: Number.parseInt(trailingNumberMatch[2], 10),
      marker: '',
      extension,
      fallback: normalized,
    }
  }

  return {
    priority: 2,
    prefix: baseName,
    numericValue: Number.POSITIVE_INFINITY,
    marker: '',
    extension,
    fallback: normalized,
  }
}

const sortFilesForTranscriptOrder = (files: File[]) => {
  return [...files].sort((left, right) => {
    const leftKey = buildFileNameSortKey(left.name)
    const rightKey = buildFileNameSortKey(right.name)

    if (leftKey.priority !== rightKey.priority) {
      return leftKey.priority - rightKey.priority
    }

    const prefixCompare = leftKey.prefix.localeCompare(rightKey.prefix, undefined, { numeric: true, sensitivity: 'base' })
    if (prefixCompare !== 0) {
      return prefixCompare
    }

    if (leftKey.numericValue !== rightKey.numericValue) {
      return leftKey.numericValue - rightKey.numericValue
    }

    const markerCompare = leftKey.marker.localeCompare(rightKey.marker, undefined, { sensitivity: 'base' })
    if (markerCompare !== 0) {
      return markerCompare
    }

    const extensionCompare = leftKey.extension.localeCompare(rightKey.extension, undefined, { sensitivity: 'base' })
    if (extensionCompare !== 0) {
      return extensionCompare
    }

    return leftKey.fallback.localeCompare(rightKey.fallback, undefined, { numeric: true, sensitivity: 'base' })
  })
}

const formatUploadedFileTimestamp = (value: string | null) => {
  if (!value) {
    return 'Unknown upload time'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown upload time'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getUploadedFileOpenUrl = (file: UploadedTranscriptionFile) => {
  return file.source_url?.trim() ?? ''
}

const getUploadedFileMediaKind = (file: UploadedTranscriptionFile) => {
  const mimeType = file.mime_type?.toLowerCase() ?? ''

  if (mimeType.startsWith('video/')) {
    return 'video'
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio'
  }

  const normalizedName = file.file_name.toLowerCase()
  if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(normalizedName)) {
    return 'video'
  }

  return 'audio'
}

const isGoogleDriveMediaUrl = (value: string) => {
  return value.includes('drive.google.com') || value.includes('drive.usercontent.google.com')
}

const getUploadedFileMediaUrl = (file: UploadedTranscriptionFile) => {
  const sourceUrl = file.source_url?.trim() ?? ''
  if (!sourceUrl) {
    return ''
  }

  if (sourceUrl.includes('/file/d/') || sourceUrl.includes('drive.google.com/file/d/')) {
    return ''
  }

  return sourceUrl
}

const getUploadedFilePreviewMode = (file: UploadedTranscriptionFile) => {
  const mediaUrl = getUploadedFileMediaUrl(file)
  if (mediaUrl && !isGoogleDriveMediaUrl(mediaUrl)) {
    return 'player' as const
  }

  return 'none' as const
}

const canPreviewUploadedFile = (file: UploadedTranscriptionFile) => {
  return getUploadedFilePreviewMode(file) !== 'none'
}

const openFilesDialog = (fileId?: string) => {
  filesDialogOpen.value = true
  if (fileId) {
    expandedFileId.value = fileId
  }
}

const openUploadedFileDetails = (file: UploadedTranscriptionFile) => {
  openFilesDialog(file.id)
}

const isUploadedFileSelected = (fileId: string) => selectedUploadedFileIds.value.includes(fileId)

const toggleUploadedFileSelection = (fileId: string, checked: boolean | 'indeterminate') => {
  if (checked === 'indeterminate') {
    return
  }

  if (checked) {
    if (!selectedUploadedFileIds.value.includes(fileId)) {
      selectedUploadedFileIds.value = [...selectedUploadedFileIds.value, fileId]
    }
    return
  }

  selectedUploadedFileIds.value = selectedUploadedFileIds.value.filter(id => id !== fileId)
}

const toggleAllFilteredUploadedFiles = (checked: boolean | 'indeterminate') => {
  if (checked === 'indeterminate') {
    return
  }

  if (!checked) {
    const filteredIds = new Set(filteredTranscriptionFiles.value.map(file => file.id))
    selectedUploadedFileIds.value = selectedUploadedFileIds.value.filter(id => !filteredIds.has(id))
    return
  }

  const nextIds = new Set(selectedUploadedFileIds.value)
  for (const file of filteredTranscriptionFiles.value) {
    nextIds.add(file.id)
  }
  selectedUploadedFileIds.value = [...nextIds]
}

const normalizeUploadedFile = (file: UploadedTranscriptionFile) => ({
  ...file,
  highlights: Array.isArray(file.highlights)
    ? file.highlights
      .map(item => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean)
    : [],
})

const fetchUploadedFiles = async () => {
  const headers = await getAuthHeaders()
  const result = await $fetch<UploadedFilesResult>('/api/tools/video-to-text/files', {
    headers,
    query: {
      t: Date.now(),
    },
  })

  return (result.files ?? []).map(normalizeUploadedFile)
}

const loadUploadedFiles = async () => {
  filesLoading.value = true
  try {
    transcriptionFiles.value = await fetchUploadedFiles()
    const availableIds = new Set(transcriptionFiles.value.map(file => file.id))
    selectedUploadedFileIds.value = selectedUploadedFileIds.value.filter(id => availableIds.has(id))
  }
  catch (error) {
    console.warn('video-to-text files load skipped', error)
    transcriptionFiles.value = []
  }
  finally {
    filesLoading.value = false
  }
}

const toggleUploadedFilesSort = () => {
  uploadedFilesSort.value = uploadedFilesSort.value === 'newest' ? 'oldest' : 'newest'
}

const buildCombinedTranscript = (files: UploadedTranscriptionFile[]) => {
  const transcriptSections = files
    .map((file, index) => {
      const text = (file.transcription ?? '').trim()
      if (!text) {
        return ''
      }

      if (files.length === 1) {
        return text
      }

      return [
        `Part ${index + 1}: ${file.file_name}`,
        text,
      ].join('\n')
    })
    .filter(Boolean)

  return transcriptSections.join('\n\n')
}

const stopWaitingForCallback = () => {
  clearPolling()
  loading.value = false
  callbackPending.value = true
  statusMessage.value = 'The workflow started, but we have not received the callback yet.'
}

const pollStatus = async () => {
  if (!jobId.value) {
    return
  }

  pollAttempts.value += 1

  try {
    const result = await $fetch<VideoToTextStatusResult>(`/api/tools/video-to-text/status/${jobId.value}`, {
      query: {
        t: Date.now(),
      },
      cache: 'no-store',
    })

    if (!result.ok || !result.job) {
      if (pollAttempts.value >= getMaxPollAttempts(transcriber.value)) {
        stopWaitingForCallback()
        return
      }

      scheduleNextPoll(pollStatus)
      return
    }

    status.value = result.job.status
    statusSourceTab.value = activeJobSourceTab.value ?? statusSourceTab.value ?? sourceTab.value

    if (result.job.status === 'completed') {
      const resolvedTranscript = (result.job.transcription || '').trim()

      if (!resolvedTranscript) {
        const emptyTranscriptMessage = result.job.error || 'Transcription finished but no spoken transcript text was detected.'
        status.value = 'failed'
        errorMessage.value = emptyTranscriptMessage
        statusMessage.value = 'Transcription failed.'
        loading.value = false
        callbackPending.value = false
        toast.error(emptyTranscriptMessage)
        clearPolling()
        return
      }

      transcript.value = resolvedTranscript
      transcriptSummary.value = typeof result.job.summary === 'string' ? result.job.summary.trim() : ''
      summaryHighlights.value = Array.isArray(result.job.highlights)
        ? result.job.highlights
          .map(item => typeof item === 'string' ? item.trim() : '')
          .filter(Boolean)
        : []
      statusMessage.value = `Transcript ready via ${result.job.transcriber}.`
      loading.value = false
      callbackPending.value = false
      lastCompletedSourceTab.value = statusSourceTab.value
      toast.success('Transcript is ready.')
      clearPolling()
      void loadUploadedFiles()
      return
    }

    if (result.job.status === 'failed') {
      errorMessage.value = result.job.error || 'The transcription job failed.'
      statusMessage.value = 'Transcription failed.'
      loading.value = false
      callbackPending.value = false
      toast.error(errorMessage.value)
      clearPolling()
      return
    }

    if (pollAttempts.value >= getMaxPollAttempts(normalizeTranscriber(result.job.transcriber))) {
      stopWaitingForCallback()
      return
    }

    scheduleNextPoll(pollStatus)
  }
  catch (error) {
    console.error('video-to-text status poll failed', error)

    if (pollAttempts.value >= getMaxPollAttempts(transcriber.value)) {
      stopWaitingForCallback()
      return
    }

    scheduleNextPoll(pollStatus, 4000)
  }
}

const pollCombinedFiles = async () => {
  if (!activeCombinedFileIds.value.length) {
    return
  }

  pollAttempts.value += 1

  try {
    const files = await fetchUploadedFiles()
    transcriptionFiles.value = files

    const orderedFiles = activeCombinedFileIds.value
      .map(fileId => files.find(file => file.id === fileId) ?? null)
      .filter((file): file is UploadedTranscriptionFile => Boolean(file))

    const completedFiles = orderedFiles.filter(file => file.status === 'completed')
    const failedFiles = orderedFiles.filter(file => file.status === 'failed')
    const processingFiles = orderedFiles.filter(file => ['queued', 'processing'].includes(file.status))
    const recoverableFailedFiles = failedFiles.filter(isEmptyTranscriptFailure)
    const blockingFailedFiles = failedFiles.filter(file => !isEmptyTranscriptFailure(file))

    combinedCompletedCount.value = completedFiles.length

    if (blockingFailedFiles.length) {
      clearPolling()
      loading.value = false
      status.value = 'failed'
      callbackPending.value = false
      const failedFile = blockingFailedFiles[0]
      errorMessage.value = failedFile.error_message || `Transcription failed for ${failedFile.file_name}.`
      statusMessage.value = 'Combined transcription failed.'
      toast.error(errorMessage.value)
      return
    }

    const resolvedFileCount = completedFiles.length + recoverableFailedFiles.length
    const allFilesResolved = orderedFiles.length === activeCombinedFileIds.value.length
      && resolvedFileCount === activeCombinedFileIds.value.length

    if (allFilesResolved && completedFiles.length > 0) {
      clearPolling()
      loading.value = false
      status.value = 'completed'
      callbackPending.value = false
      activeCombinedFileNames.value = completedFiles.map(file => file.file_name)
      transcript.value = buildCombinedTranscript(completedFiles)
      transcriptSummary.value = ''
      summaryHighlights.value = []
      lastCompletedSourceTab.value = 'file'
      errorMessage.value = ''
      const skippedCount = recoverableFailedFiles.length
      statusMessage.value = skippedCount > 0
        ? `Combined transcript ready from ${completedFiles.length} parts via ${transcriber.value}. Skipped ${skippedCount} part${skippedCount === 1 ? '' : 's'} with no detected speech.`
        : activeCombinedFileIds.value.length > 1
          ? `Combined transcript ready from ${activeCombinedFileIds.value.length} parts via ${transcriber.value}.`
          : `Transcript ready via ${transcriber.value}.`
      toast.success(
        skippedCount > 0
          ? `Transcript ready. Skipped ${skippedCount} part${skippedCount === 1 ? '' : 's'} with no detected speech.`
          : activeCombinedFileIds.value.length > 1
            ? 'Combined transcript is ready.'
            : 'Transcript is ready.',
      )
      return
    }

    status.value = 'processing'
    statusSourceTab.value = 'file'
    activeJobSourceTab.value = 'file'
    callbackPending.value = false
    statusMessage.value = activeCombinedFileIds.value.length > 1
      ? `Processing ${completedFiles.length} of ${activeCombinedFileIds.value.length} uploaded parts...`
      : 'Processing uploaded file...'

    if (!processingFiles.length && pollAttempts.value >= getMaxPollAttempts(transcriber.value)) {
      stopWaitingForCallback()
      return
    }

    scheduleNextPoll(pollCombinedFiles)
  }
  catch (error) {
    console.error('video-to-text combined files poll failed', error)

    if (pollAttempts.value >= getMaxPollAttempts(transcriber.value)) {
      stopWaitingForCallback()
      return
    }

    scheduleNextPoll(pollCombinedFiles, 4000)
  }
}

const submitForTranscription = async () => {
  const trimmedUrl = sourceUrl.value.trim()

  if (!trimmedUrl) {
    return
  }

  clearPolling()
  loading.value = true
  errorMessage.value = ''
  transcript.value = ''
  transcriptSummary.value = ''
  summaryHighlights.value = []
  summaryDialogOpen.value = false
  activeCombinedFileIds.value = []
  activeCombinedFileNames.value = []
  combinedCompletedCount.value = 0
  status.value = 'processing'
  statusSourceTab.value = 'url'
  activeJobSourceTab.value = 'url'
  callbackPending.value = false
  callbackUrl.value = ''
  pollAttempts.value = 0
  statusMessage.value = `Starting ${transcriber.value} transcription workflow...`

  try {
    const result = await $fetch<StartTranscriptionResult>('/api/tools/video-to-text/start', {
      method: 'POST',
      body: {
        url: trimmedUrl,
        transcriber: transcriber.value,
      },
    })

    if (!result.ok || !result.jobId) {
      loading.value = false
      status.value = 'failed'
      errorMessage.value = result.message || 'The transcription workflow could not be started.'
      statusMessage.value = 'Transcription could not be started.'
      toast.error(errorMessage.value)
      return
    }

    jobId.value = result.jobId
    callbackReachable.value = result.callbackReachable ?? true
    callbackUrl.value = result.callbackUrl ?? ''
    statusMessage.value = result.message

    if (callbackReachable.value) {
      scheduleNextPoll(pollStatus, 2500)
    }
    else {
      loading.value = false
      callbackPending.value = true
    }
  }
  catch (error) {
    console.error('video-to-text submit failed', error)
    loading.value = false
    status.value = 'failed'
    errorMessage.value = getApiErrorMessage(error)
    statusMessage.value = 'Transcription could not be started.'
    toast.error(errorMessage.value)
  }
}

const runTranscription = async () => {
  if (sourceTab.value === 'file') {
    await uploadAndTranscribeFile()
    return
  }

  await submitForTranscription()
}

const refreshStatus = async () => {
  if (!jobId.value && !activeCombinedFileIds.value.length) {
    return
  }

  loading.value = true
  callbackPending.value = false
  pollAttempts.value = 0
  statusMessage.value = 'Checking for the latest transcript status...'
  if (activeCombinedFileIds.value.length) {
    await pollCombinedFiles()
    return
  }

  await pollStatus()
}

const handleFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  selectedUploadFiles.value = input?.files ? sortFilesForTranscriptOrder(Array.from(input.files)) : []
}

const uploadAndTranscribeFile = async () => {
  if (!selectedUploadFiles.value.length) {
    toast.error('Choose one or more files before uploading.')
    return
  }

  const oversizedFile = selectedUploadFiles.value.find(file => file.size > MAX_UPLOAD_FILE_BYTES)
  if (oversizedFile) {
    toast.error(`${oversizedFile.name} is too large. Keep uploads under ${formatUploadLimit(MAX_UPLOAD_FILE_BYTES)} per file.`)
    return
  }

  uploadingFile.value = true
  errorMessage.value = ''
  transcript.value = ''
  transcriptSummary.value = ''
  summaryHighlights.value = []
  summaryDialogOpen.value = false
  activeCombinedFileIds.value = []
  activeCombinedFileNames.value = []
  combinedCompletedCount.value = 0
  clearPolling()

  try {
    const headers = await getAuthHeaders()
    if (!supabase) {
      throw new Error('Please sign in to manage uploaded files.')
    }

    const filesToUpload = [...selectedUploadFiles.value]
    const uploadedFileIds: string[] = []
    const uploadedFileNames: string[] = []
    let latestResultMessage = ''

    for (const [index, selectedFile] of filesToUpload.entries()) {
      statusMessage.value = filesToUpload.length > 1
        ? `Uploading part ${index + 1} of ${filesToUpload.length}: ${selectedFile.name}`
        : `Uploading ${selectedFile.name}...`

      const uploadInit = await $fetch<SignedUploadInitResult>('/api/tools/video-to-text/files/upload/signed-url', {
        method: 'POST',
        headers,
        body: {
          fileName: selectedFile.name,
          fileSizeBytes: selectedFile.size,
        },
      })

      const { error: uploadError } = await supabase.storage
        .from(uploadInit.bucket)
        .uploadToSignedUrl(uploadInit.path, uploadInit.token, selectedFile, {
          contentType: selectedFile.type || 'application/octet-stream',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Could not upload file to Supabase Storage.')
      }

      const result = await $fetch<UploadFileResult>('/api/tools/video-to-text/files/upload/complete', {
        method: 'POST',
        headers,
        body: {
          fileId: uploadInit.fileId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileSizeBytes: selectedFile.size,
          bucket: uploadInit.bucket,
          path: uploadInit.path,
          transcriber: transcriber.value,
          autoTranscribe: true,
        },
      })

      if (result.file?.id) {
        uploadedFileIds.push(result.file.id)
        uploadedFileNames.push(result.file.file_name)
      }

      latestResultMessage = result.message || latestResultMessage

      if (result.ok === false) {
        throw new Error(result.message || 'File uploaded, but transcription could not be started.')
      }
    }

    activeCombinedFileIds.value = uploadedFileIds
    activeCombinedFileNames.value = uploadedFileNames
    combinedCompletedCount.value = 0
    jobId.value = ''
    status.value = 'processing'
    statusSourceTab.value = 'file'
    activeJobSourceTab.value = 'file'
    loading.value = true
    pollAttempts.value = 0
    callbackPending.value = false
    statusMessage.value = filesToUpload.length > 1
      ? `Uploaded ${filesToUpload.length} parts. Waiting for combined transcription...`
      : (latestResultMessage || 'File uploaded and transcription started.')

    selectedUploadFiles.value = []
    await loadUploadedFiles()
    scheduleNextPoll(pollCombinedFiles, 2500)
    toast.success(filesToUpload.length > 1
      ? `Uploaded ${filesToUpload.length} parts. Combining transcript when all parts finish.`
      : (latestResultMessage || 'File uploaded to Supabase Storage.'))
  }
  catch (error) {
    const message = getApiErrorMessage(error)
    errorMessage.value = message
    toast.error(message)
  }
  finally {
    uploadingFile.value = false
  }
}

const transcribeUploadedFile = async (file: UploadedTranscriptionFile) => {
  loading.value = true
  errorMessage.value = ''
  transcript.value = ''
  transcriptSummary.value = ''
  summaryHighlights.value = []
  activeCombinedFileIds.value = [file.id]
  activeCombinedFileNames.value = [file.file_name]
  combinedCompletedCount.value = 0
  status.value = 'processing'
  statusSourceTab.value = 'file'
  activeJobSourceTab.value = 'file'
  callbackPending.value = false
  pollAttempts.value = 0

  try {
    const headers = await getAuthHeaders()
    const result = await $fetch<StartTranscriptionResult>('/api/tools/video-to-text/files/' + file.id + '/transcribe', {
      method: 'POST',
      headers,
      body: {
        transcriber: transcriber.value,
      },
    })

    if (!result.ok || !result.jobId) {
      throw new Error(result.message || 'Could not start file transcription.')
    }

    jobId.value = result.jobId
    callbackReachable.value = result.callbackReachable ?? true
    callbackUrl.value = result.callbackUrl ?? ''
    statusMessage.value = result.message
    scheduleNextPoll(pollStatus, 2500)
    await loadUploadedFiles()
  }
  catch (error) {
    loading.value = false
    status.value = 'failed'
    const message = getApiErrorMessage(error)
    errorMessage.value = message
    statusMessage.value = 'Transcription could not be started.'
    toast.error(message)
  }
}

const deleteUploadedFile = async (file: UploadedTranscriptionFile) => {
  if (deletingFileId.value) {
    return
  }

  deletingFileId.value = file.id
  try {
    const headers = await getAuthHeaders()
    const result = await $fetch<{ success: boolean, driveDeleteError?: string | null }>('/api/tools/video-to-text/files/' + file.id, {
      method: 'DELETE',
      headers,
    })

    if (expandedFileId.value === file.id) {
      expandedFileId.value = ''
    }

    await loadUploadedFiles()
    if (result.driveDeleteError) {
      toast('File removed locally, but Drive deletion reported an issue.')
      return
    }

    toast.success('Uploaded file deleted.')
  }
  catch (error) {
    toast.error(getApiErrorMessage(error))
  }
  finally {
    deletingFileId.value = ''
  }
}

const deleteUploadedFilesBatch = async (files: UploadedTranscriptionFile[]) => {
  if (!files.length || bulkDeleting.value || deletingFileId.value) {
    return
  }

  if (!import.meta.client) {
    return
  }

  const isDeleteAll = files.length === transcriptionFiles.value.length && transcriptionFiles.value.length > 0
  const confirmed = window.confirm(
    isDeleteAll
      ? `Delete all ${files.length} uploaded files from Supabase Storage and the app records?`
      : `Delete ${files.length} selected uploaded file${files.length === 1 ? '' : 's'} from Supabase Storage and the app records?`,
  )

  if (!confirmed) {
    return
  }

  bulkDeleting.value = true

  try {
    const headers = await getAuthHeaders()

    for (const file of files) {
      await $fetch<{ success: boolean, driveDeleteError?: string | null }>('/api/tools/video-to-text/files/' + file.id, {
        method: 'DELETE',
        headers,
      })
    }

    if (expandedFileId.value && files.some(file => file.id === expandedFileId.value)) {
      expandedFileId.value = ''
    }

    selectedUploadedFileIds.value = selectedUploadedFileIds.value.filter(id => !files.some(file => file.id === id))
    await loadUploadedFiles()
    toast.success(
      isDeleteAll
        ? 'All uploaded files deleted.'
        : `${files.length} uploaded file${files.length === 1 ? '' : 's'} deleted.`,
    )
  }
  catch (error) {
    toast.error(getApiErrorMessage(error))
  }
  finally {
    bulkDeleting.value = false
  }
}

const deleteSelectedUploadedFiles = async () => {
  const files = transcriptionFiles.value.filter(file => selectedUploadedFileIds.value.includes(file.id))
  await deleteUploadedFilesBatch(files)
}

const deleteAllUploadedFiles = async () => {
  await deleteUploadedFilesBatch(transcriptionFiles.value)
}

const stopTranscription = () => {
  clearPolling()
  loading.value = false
  callbackPending.value = false
  activeCombinedFileIds.value = []
  activeCombinedFileNames.value = []
  combinedCompletedCount.value = 0
  status.value = 'cancelled'
  statusMessage.value = 'Transcription stopped.'
  errorMessage.value = 'You stopped this transcription run.'
  jobId.value = ''
  toast('Transcription stopped.')
}

const copyTranscript = async () => {
  if (!canCopyTranscript.value) {
    toast.error('There is no transcript to copy yet.')
    return
  }

  if (!import.meta.client || !navigator.clipboard) {
    toast.error('Clipboard access is not available in this browser.')
    return
  }

  try {
    await navigator.clipboard.writeText(transcript.value)
    toast.success('Transcript copied to clipboard.')
  }
  catch (error) {
    console.error('video-to-text copy failed', error)
    toast.error('We could not copy the transcript right now.')
  }
}

const openSummary = async () => {
  if (!transcript.value.trim()) {
    toast.error('Transcript is required before generating a summary.')
    return
  }

  if (hasSummaryContent.value) {
    summaryDialogOpen.value = true
    return
  }

  summaryLoading.value = true

  try {
    const result = await $fetch<{ ok: boolean, summary: string, highlights: string[] }>('/api/tools/video-to-text/summary', {
      method: 'POST',
      body: {
        transcript: transcript.value,
        sourceUrl: sourceTab.value === 'file'
          ? activeCombinedFileNames.value.join(', ')
          : sourceUrl.value.trim(),
        transcriber: transcriber.value,
      },
    })

    if (!result.ok) {
      throw new Error('Summary generation failed.')
    }

    transcriptSummary.value = result.summary.trim()
    summaryHighlights.value = Array.isArray(result.highlights)
      ? result.highlights
        .map(item => typeof item === 'string' ? item.trim() : '')
        .filter(Boolean)
      : []

    summaryDialogOpen.value = true
  }
  catch (error) {
    console.error('video-to-text summary failed', error)
    toast.error('We could not generate a summary right now.')
  }
  finally {
    summaryLoading.value = false
  }
}

const copySummary = async () => {
  if (!canCopySummary.value) {
    toast.error('There is no summary to copy yet.')
    return
  }

  if (!import.meta.client || !navigator.clipboard) {
    toast.error('Clipboard access is not available in this browser.')
    return
  }

  const summaryText = transcriptSummary.value.trim()
  const highlightsText = summaryHighlights.value.length
    ? `\n\nHighlights:\n${summaryHighlights.value.map(item => `- ${item}`).join('\n')}`
    : ''

  try {
    await navigator.clipboard.writeText(`${summaryText}${highlightsText}`.trim())
    toast.success('Summary copied to clipboard.')
  }
  catch (error) {
    console.error('video-to-text summary copy failed', error)
    toast.error('We could not copy the summary right now.')
  }
}

onBeforeUnmount(() => {
  clearPolling()
})

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  const storedTranscriber = window.localStorage.getItem('video-to-text-transcriber')

  if (storedTranscriber && ['assemblyai', 'deepgram', 'whisper'].includes(storedTranscriber)) {
    transcriber.value = storedTranscriber as VideoToTextTranscriber
  }

  void loadUploadedFiles()
})

watch(transcriber, (value) => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem('video-to-text-transcriber', value)
})

watch(filesDialogOpen, (open) => {
  if (!open) {
    expandedFileId.value = ''
    selectedUploadedFileIds.value = []
  }
})
</script>

<template>
  <section class="mx-auto w-full max-w-6xl space-y-6">
    <div class="space-y-2 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
        {{ props.project.categoryLabel }}
      </p>
      <h3 class="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {{ props.project.title }}
      </h3>
      <p class="mx-auto max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
        Paste a YouTube URL or upload a file, start transcription, and review the completed transcript below as soon as n8n returns the result.
      </p>
    </div>

    <Card class="rounded-[2rem] border-border/60 bg-card/92 p-5 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.6)] md:p-6">
      <CardContent class="space-y-3 p-0">
        <Tabs v-model="sourceTab" class="w-full">
          <TabsList>
            <TabsTrigger value="url">
              URL
            </TabsTrigger>
            <TabsTrigger value="file">
              File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" class="mt-3">
            <Input
              v-model="sourceUrl"
              type="url"
              placeholder="Paste a YouTube URL here..."
              class="h-11 rounded-full"
              @keydown.enter.prevent="runTranscription"
            />
          </TabsContent>

          <TabsContent value="file" class="mt-3">
            <Input
              type="file"
              accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.mov,.webm"
              multiple
              class="h-11 border-border/70 bg-background/90 file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-primary/30"
              @change="handleFileSelection"
            />
            <p class="mt-2 text-xs text-muted-foreground">
              Supported formats: `.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, `.webm` (plus most `audio/*` and `video/*` files). Max upload size: `{{ formatUploadLimit(MAX_UPLOAD_FILE_BYTES) }}` per file.
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Select one file or multiple split parts. File uploads are transcribed in order and combined into one transcript with one Fathom-style summary.
            </p>

            <div v-if="selectedUploadFileCount" class="mt-3 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {{ selectedUploadFileCount }} {{ selectedUploadFileCount === 1 ? 'file' : 'files' }} selected
                </span>
                <span class="text-xs text-muted-foreground">
                  Total selected size: {{ formatUploadedFileSize(selectedUploadTotalBytes) }}
                </span>
              </div>

              <ul class="space-y-1 text-xs text-muted-foreground">
                <li
                  v-for="file in selectedUploadFileSummaries"
                  :key="file.id"
                  class="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                >
                  <span class="truncate">{{ file.name }}</span>
                  <span class="shrink-0">{{ formatUploadedFileSize(file.size) }}</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div class="flex flex-wrap items-center gap-2">
          <Select v-model="transcriber">
            <SelectTrigger class="h-10 min-w-[9.5rem] rounded-lg px-3">
              <SelectValue placeholder="Transcriber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in transcriberOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            class="h-10 rounded-lg px-5"
            :disabled="!canTranscribe"
            @click="runTranscription"
          >
            <Icon
              v-if="loading || uploadingFile"
              name="lucide:loader-circle"
              class="mr-2 size-4 animate-spin"
            />
            <span>{{ loading || uploadingFile ? 'Transcribing...' : (sourceTab === 'file' && selectedUploadFileCount > 1 ? 'Combine & Transcribe' : 'Transcribe') }}</span>
          </Button>

          <Button
            v-if="canStopTranscription"
            type="button"
            variant="destructive"
            size="icon"
            class="size-10 rounded-md"
            @click="stopTranscription"
          >
            <Icon name="lucide:square" class="size-4 fill-current" />
            <span class="sr-only">Stop transcription</span>
          </Button>

          <Tooltip v-if="sourceTab === 'file'">
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="ml-auto size-10 rounded-md"
                @click="openFilesDialog()"
              >
                <Icon name="lucide:folder-search-2" class="size-4" />
                <span class="sr-only">Manage uploaded files</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Manage uploaded files
            </TooltipContent>
          </Tooltip>
        </div>

      <div class="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <p v-if="shouldShowStatusMessage">{{ statusMessage }}</p>
        <p>{{ sourceDescription }}</p>
        <p v-if="sourceTab === 'url'">
          Request body uses your selected transcriber, the video URL, and the env-backed callback URL.
        </p>
        <p v-else>
          Upload request stores the media in Supabase Storage, then starts transcription from a signed app relay URL.
        </p>
        <p v-if="callbackNotice" class="text-amber-500">
          {{ callbackNotice }}
        </p>
        <p v-if="isCurrentTabStatus && !callbackReachable" class="text-amber-500">
          Callback delivery needs a public callback URL. Set `NUXT_VIDEO_TO_TEXT_CALLBACK_URL` if you are testing through a tunnel or external endpoint.
        </p>
        <p v-if="errorMessage" class="text-destructive">
          {{ errorMessage }}
        </p>
        <div v-if="isCurrentTabStatus && callbackPending" class="pt-1">
          <Button
            type="button"
            variant="outline"
            class="rounded-full"
            @click="refreshStatus"
          >
            Check status again
          </Button>
        </div>
      </div>

      <div class="mt-3">
        <span
          class="inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
          :class="statusBadgeClass"
        >
          {{ displayStatus }}
        </span>
      </div>

      <div v-if="false && sourceTab === 'file'" class="mt-2 rounded-2xl border border-border/70 bg-background/70 p-3">
        <div class="mb-3 space-y-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary/85">
              Uploaded files
            </p>
            <p class="text-xs text-muted-foreground">
              New uploads are stored in private Supabase Storage and opened with refreshed signed links.
            </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div class="relative min-w-0 flex-1 sm:min-w-[15rem]">
                <Icon
                  name="lucide:search"
                  class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  v-model="uploadedFilesSearch"
                  type="search"
                  placeholder="Search uploaded files..."
                  class="h-9 rounded-full pl-9"
                />
              </div>

              <Select v-model="uploadedFilesSort">
                <SelectTrigger class="h-9 min-w-[11rem] rounded-full">
                  <SelectValue placeholder="Sort files" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in uploadedFilesSortOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-9 rounded-full px-3 text-xs"
                :disabled="filesLoading"
                @click="loadUploadedFiles"
              >
                Refresh
              </Button>
            </div>
          </div>

          <p class="text-xs text-muted-foreground">
            Search by file name, status, transcriber, or upload date. Preview opens inside the canvas, and audio or video files can be played inline when a playable media URL is available.
          </p>
        </div>

        <div v-if="filesLoading" class="text-sm text-muted-foreground">
          Loading files...
        </div>
        <div v-else-if="filteredTranscriptionFiles.length === 0" class="text-sm text-muted-foreground">
          {{ transcriptionFiles.length ? 'No uploaded files match your search.' : 'No uploaded files yet.' }}
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="file in filteredTranscriptionFiles"
            :key="file.id"
            class="rounded-xl border border-border/70 bg-card/70 p-3"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0 space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ file.file_name }}
                  </p>
                  <span class="inline-flex rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {{ file.status }}
                  </span>
                </div>
                <p class="hidden text-xs text-muted-foreground">
                  {{ formatUploadedFileSize(file.file_size_bytes) }} · {{ file.status }}
                </p>
                <p class="hidden text-xs text-muted-foreground">
                  {{ formatUploadedFileSize(file.file_size_bytes) }} · {{ file.transcriber }} · {{ formatUploadedFileTimestamp(file.created_at) }}
                </p>
                <p class="hidden text-xs text-muted-foreground">
                  {{ formatUploadedFileSize(file.file_size_bytes) }}
                  <span aria-hidden="true"> · </span>
                  {{ file.transcriber }}
                  <span aria-hidden="true"> · </span>
                  {{ formatUploadedFileTimestamp(file.created_at) }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatUploadedFileSize(file.file_size_bytes) }} / {{ file.transcriber }} / {{ formatUploadedFileTimestamp(file.created_at) }}
                </p>
                <p v-if="file.mime_type" class="text-xs text-muted-foreground">
                  {{ file.mime_type }}
                </p>
                <p v-if="file.error_message" class="mt-1 text-xs text-destructive">
                  {{ file.error_message }}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="rounded-full"
                  :disabled="loading || ['processing', 'queued'].includes(file.status)"
                  @click="transcribeUploadedFile(file)"
                >
                  Transcribe
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="rounded-full"
                  :disabled="!canPreviewUploadedFile(file)"
                  @click="openUploadedFileDetails(file)"
                >
                  Preview
                </Button>
                <Button
                  v-if="getUploadedFileOpenUrl(file)"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="rounded-full"
                  as-child
                >
                  <a :href="getUploadedFileOpenUrl(file)" target="_blank" rel="noreferrer">Open</a>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  class="rounded-full bg-red-600 px-4 text-white hover:bg-red-500"
                  :disabled="deletingFileId === file.id"
                  @click="deleteUploadedFile(file)"
                >
                  {{ deletingFileId === file.id ? 'Deleting...' : 'Delete' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>

    <Card v-if="shouldShowTranscriptCard" class="rounded-[2rem] border-border/60 bg-background/80 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.6)] md:p-6">
      <CardHeader class="mb-1 p-0">
        <div class="space-y-1">
          <CardTitle class="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
            Transcript
          </CardTitle>
          <CardDescription class="text-sm text-muted-foreground">
            The finished transcription appears here after the callback completes.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <div class="mb-0.5 flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="rounded-md"
                :disabled="!canCopyTranscript"
                @click="copyTranscript"
              >
                <Icon name="lucide:copy" class="size-4" />
                <span class="sr-only">Copy transcript</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Copy transcript
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="rounded-md"
                :disabled="!canCopyTranscript || summaryLoading"
                @click="openSummary"
              >
                <Icon
                  v-if="summaryLoading"
                  name="lucide:loader-circle"
                  class="size-4 animate-spin"
                />
                <Icon
                  v-else
                  name="lucide:sparkles"
                  class="size-4"
                />
                <span class="sr-only">Open summary</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Summary
            </TooltipContent>
          </Tooltip>
        </div>

        <div class="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90">
          <ScrollArea class="h-[22rem] rounded-[1.5rem] md:h-[28rem]">
            <div
              v-if="formattedTranscriptParagraphs.length"
              class="space-y-5 px-5 py-4 text-sm leading-7 text-foreground md:text-[0.95rem]"
            >
              <p
                v-for="(paragraph, index) in formattedTranscriptParagraphs"
                :key="`${index}-${paragraph.slice(0, 24)}`"
                class="whitespace-pre-wrap text-pretty"
              >
                {{ paragraph }}
              </p>
            </div>

            <div
              v-else
              class="flex h-[22rem] items-center justify-center px-5 py-4 text-center text-sm text-muted-foreground md:h-[28rem] md:text-[0.95rem]"
            >
              {{ loading ? 'Waiting for transcription callback...' : 'Your transcript will appear here.' }}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="summaryDialogOpen">
      <DialogContent
        class="border-[#4a433d] bg-[#2b2724]/95 text-[#f0deca] sm:max-w-2xl [&>[data-slot=dialog-close]]:text-[#ab9986] [&>[data-slot=dialog-close]]:hover:bg-[#221f1d] [&>[data-slot=dialog-close]]:hover:text-[#fff4e6] [&>[data-slot=dialog-close]]:data-[state=open]:bg-[#221f1d] [&>[data-slot=dialog-close]]:data-[state=open]:text-[#fff4e6]"
      >
        <DialogHeader class="space-y-3">
          <div class="flex items-center justify-between gap-3 pr-8">
            <DialogTitle class="text-[#fff4e6]">
              Transcript summary
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="h-8 rounded-full border-[#4a433d] bg-[#221f1d] px-3 text-xs text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
              :disabled="!canCopySummary"
              @click="copySummary"
            >
              <Icon name="lucide:copy" class="mr-1.5 size-3.5" />
              Copy summary
            </Button>
          </div>
          <DialogDescription class="text-[#ab9986]">
            Structured Fathom-style summary and key highlights generated from the completed transcript.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-5 py-1">
          <div v-if="formattedSummaryParagraphs.length" class="space-y-3 text-sm leading-7 text-[#f0deca]">
            <p
              v-for="(paragraph, index) in formattedSummaryParagraphs"
              :key="`summary-${index}-${paragraph.slice(0, 24)}`"
              class="whitespace-pre-wrap text-pretty"
            >
              {{ paragraph }}
            </p>
          </div>

          <p v-else class="text-sm text-[#ab9986]">
            No summary was returned yet.
          </p>

          <div v-if="summaryHighlights.length" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#d47f55]">
              Highlights
            </p>
            <ul class="space-y-2 text-sm leading-6 text-[#f0deca]">
              <li
                v-for="(highlight, index) in summaryHighlights"
                :key="`highlight-${index}-${highlight.slice(0, 20)}`"
                class="rounded-xl border border-[#4a433d]/70 bg-[#221f1d] px-3 py-2"
              >
                {{ highlight }}
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="filesDialogOpen">
      <DialogScrollContent class="max-h-[min(88vh,960px)] rounded-[1.75rem] border-border bg-[#1d1a18] p-0 text-[#f4ede3] shadow-[0_38px_110px_-50px_rgba(0,0,0,0.88)] backdrop-blur-none sm:max-w-5xl">
        <DialogHeader class="border-b border-[#3b342f] bg-[#221e1b] px-5 py-4 md:px-6">
          <div class="pr-8">
            <DialogTitle class="text-base font-semibold text-[#fff4e6]">
              Uploaded files
            </DialogTitle>
            <DialogDescription class="mt-1 text-sm text-[#b8aa99]">
              Browse, search, sort, preview, and manage your uploaded media files in one canvas modal.
            </DialogDescription>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex w-full flex-wrap items-center gap-2">
              <div class="relative min-w-0 flex-1">
                <Icon
                  name="lucide:search"
                  class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8f857a]"
                />
                <Input
                  v-model="uploadedFilesSearch"
                  type="search"
                  placeholder="Search uploaded files..."
                  class="h-10 rounded-lg border-[#4a433d] bg-[#181513] pl-9 text-[#fff4e6] placeholder:text-[#8f857a]"
                />
              </div>

              <Select v-model="uploadedFilesStatusFilter">
                <SelectTrigger class="h-10 min-w-[10.5rem] rounded-lg border-[#4a433d] bg-[#181513] px-3 text-[#f0deca]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in uploadedFilesStatusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    class="size-10 rounded-md text-[#d7c7b4] hover:bg-[#2b2521] hover:text-[#fff4e6]"
                    @click="toggleUploadedFilesSort"
                  >
                    <Icon name="lucide:arrow-up-down" class="size-4" />
                    <span class="sr-only">Toggle uploaded files date sort</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Sort by date: {{ uploadedFilesSortLabel }}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    class="size-10 rounded-md text-[#d7c7b4] hover:bg-[#2b2521] hover:text-[#fff4e6]"
                    :disabled="filesLoading"
                    @click="loadUploadedFiles"
                  >
                    <Icon
                      name="lucide:refresh-cw"
                      class="size-4"
                      :class="filesLoading ? 'animate-spin' : ''"
                    />
                    <span class="sr-only">Refresh uploaded files</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Refresh files
                </TooltipContent>
              </Tooltip>
            </div>

            <div
              v-if="transcriptionFiles.length"
              class="flex flex-col gap-3 rounded-2xl border border-[#3b342f] bg-[#181513] px-3 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div class="flex items-center gap-3">
                <Checkbox
                  :checked="allFilteredFilesSelected ? true : (someFilteredFilesSelected ? 'indeterminate' : false)"
                  aria-label="Select all visible uploaded files"
                  @update:checked="toggleAllFilteredUploadedFiles"
                />
                <p class="text-sm text-[#f0deca]">
                  <span class="font-medium">{{ selectedUploadedFilesCount }}</span>
                  selected
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="rounded-full"
                  :disabled="selectedUploadedFilesCount === 0 || bulkDeleting || Boolean(deletingFileId)"
                  @click="deleteSelectedUploadedFiles"
                >
                  <Icon name="lucide:trash-2" class="mr-2 size-4" />
                  {{ bulkDeleting ? 'Deleting...' : `Delete selected (${selectedUploadedFilesCount})` }}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  class="rounded-full"
                  :disabled="transcriptionFiles.length === 0 || bulkDeleting || Boolean(deletingFileId)"
                  @click="deleteAllUploadedFiles"
                >
                  <Icon name="lucide:trash" class="mr-2 size-4" />
                  Delete all
                </Button>
              </div>
            </div>

            <p class="text-xs text-[#9b8f82]">
              New uploads are stored in private Supabase Storage and opened with refreshed signed links.
            </p>
          </div>
        </DialogHeader>

        <div class="max-h-[calc(min(88vh,960px)-13.5rem)] overflow-y-auto bg-[#1d1a18] px-5 py-4 md:px-6 md:py-5">
          <div v-if="filesLoading" class="text-sm text-[#b8aa99]">
            Loading files...
          </div>
          <div v-else-if="filteredTranscriptionFiles.length === 0" class="text-sm text-[#b8aa99]">
            {{ transcriptionFiles.length ? 'No uploaded files match your search.' : 'No uploaded files yet.' }}
          </div>
          <Accordion
            v-else
            v-model="expandedFileId"
            type="single"
            collapsible
            class="space-y-3"
          >
            <AccordionItem
              v-for="file in filteredTranscriptionFiles"
              :key="file.id"
              :value="file.id"
              class="rounded-2xl border border-[#3b342f] bg-[#24201d] px-4 shadow-[inset_0_1px_0_rgba(255,244,230,0.02)]"
            >
              <div class="flex items-start gap-3">
                <div class="pt-4">
                  <Checkbox
                    :checked="isUploadedFileSelected(file.id)"
                    :aria-label="`Select ${file.file_name}`"
                    @update:checked="(checked) => toggleUploadedFileSelection(file.id, checked)"
                  />
                </div>

                <AccordionTrigger class="flex-1 py-4 hover:no-underline">
                  <div class="min-w-0 space-y-1 text-left">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="truncate text-sm font-medium text-[#fff4e6]">
                        {{ file.file_name }}
                      </p>
                      <span class="inline-flex rounded-full border border-[#4a433d] bg-[#181513] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#c3b5a5]">
                        {{ file.status }}
                      </span>
                    </div>
                    <p class="text-xs text-[#b8aa99]">
                      {{ formatUploadedFileSize(file.file_size_bytes) }} / {{ file.transcriber }} / {{ formatUploadedFileTimestamp(file.created_at) }}
                    </p>
                  </div>
                </AccordionTrigger>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      class="mt-3 rounded-md"
                    >
                      <Icon name="lucide:ellipsis" class="size-4" />
                      <span class="sr-only">Open file actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem
                      :disabled="!canPreviewUploadedFile(file)"
                      @select="openUploadedFileDetails(file)"
                    >
                      <Icon name="lucide:play-square" class="size-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="getUploadedFileOpenUrl(file)"
                      as-child
                    >
                      <a :href="getUploadedFileOpenUrl(file)" target="_blank" rel="noreferrer">
                        <Icon name="lucide:external-link" class="size-4" />
                        Open media
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      :disabled="deletingFileId === file.id || bulkDeleting"
                      @select="deleteUploadedFile(file)"
                    >
                      <Icon name="lucide:trash-2" class="size-4" />
                      {{ deletingFileId === file.id ? 'Deleting...' : 'Delete' }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <AccordionContent class="pb-4">
                <div class="space-y-4">
                  <ul class="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <li class="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span class="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Uploaded</span>
                      <span>{{ formatUploadedFileTimestamp(file.created_at) }}</span>
                    </li>
                    <li class="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span class="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Size</span>
                      <span>{{ formatUploadedFileSize(file.file_size_bytes) }}</span>
                    </li>
                    <li class="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span class="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Transcriber</span>
                      <span>{{ file.transcriber }}</span>
                    </li>
                    <li class="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span class="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary/80">Format</span>
                      <span>{{ file.mime_type || 'Unknown format' }}</span>
                    </li>
                  </ul>

                  <div class="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="rounded-full"
                      :disabled="loading || ['processing', 'queued'].includes(file.status)"
                      @click="transcribeUploadedFile(file)"
                    >
                      Transcribe
                    </Button>
                    <Button
                      v-if="getUploadedFileOpenUrl(file)"
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="rounded-full"
                      as-child
                    >
                      <a :href="getUploadedFileOpenUrl(file)" target="_blank" rel="noreferrer">Open</a>
                    </Button>
                  </div>

                  <div class="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70">
                    <MediaPreview
                      v-if="getUploadedFilePreviewMode(file) === 'player'"
                      :title="file.file_name"
                      :src="getUploadedFileMediaUrl(file)"
                      :media-kind="getUploadedFileMediaKind(file)"
                    />
                    <div
                      v-else
                      class="flex h-[16rem] items-center justify-center px-6 text-center text-sm text-muted-foreground"
                    >
                      Preview is not available for this file yet. Use Open to view it in a new tab.
                    </div>
                  </div>

                  <p
                    v-if="getUploadedFilePreviewMode(file) === 'player' && getUploadedFileMediaKind(file) === 'audio'"
                    class="text-xs text-muted-foreground"
                  >
                    This file is audio-only ({{ file.mime_type || 'unknown type' }}), so no video picture will appear.
                  </p>

                  <p v-if="file.error_message" class="text-sm text-destructive">
                    {{ file.error_message }}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogScrollContent>
    </Dialog>

          <!-- legacy preview modal block removed
          <div class="border-b border-border/60 px-5 py-4 md:px-6">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0 space-y-1">
                <DialogTitle class="truncate text-base font-semibold text-foreground">
                  {{ selectedPreviewFile.file_name }}
                </DialogTitle>
                <DialogDescription class="text-sm text-muted-foreground">
                  Uploaded {{ formatUploadedFileTimestamp(selectedPreviewFile.created_at) }} · {{ formatUploadedFileSize(selectedPreviewFile.file_size_bytes) }}
                </DialogDescription>
                <p v-if="selectedPreviewFile.mime_type" class="text-xs text-muted-foreground">
                  {{ selectedPreviewFile.mime_type }}
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  v-if="selectedPreviewOpenUrl"
                  type="button"
                  variant="outline"
                  size="sm"
                  class="rounded-full"
                  as-child
                >
                  <a :href="selectedPreviewOpenUrl" target="_blank" rel="noreferrer">Open in Drive</a>
                </Button>
              </div>
            </div>
          </div>

          <div class="space-y-3 px-5 py-4 md:px-6 md:py-5">
            <p class="text-sm text-muted-foreground">
              Uploaded files now use Supabase Storage and should preview inline when a playable signed URL is available.
            </p>

            <div class="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70">
              <iframe
                v-if="selectedPreviewEmbedUrl"
                :src="selectedPreviewEmbedUrl"
                class="h-[24rem] w-full bg-background md:h-[32rem]"
                allow="autoplay"
              />

              <div
                v-else
                class="flex h-[20rem] items-center justify-center px-6 text-center text-sm text-muted-foreground"
              >
                Preview is not available for this file yet. Use Open in Drive to view it in a new tab.
              </div>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>
    -->
  </section>
</template>
