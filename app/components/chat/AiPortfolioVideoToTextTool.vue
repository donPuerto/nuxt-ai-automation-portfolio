<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'
import VidstackPreview from '@/components/ui/media/VidstackPreview.vue'
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
  file: UploadedTranscriptionFile | null
  jobId?: string
  message?: string
}

type UploadedFilesResult = {
  files: UploadedTranscriptionFile[]
}

type UploadedFilesSortOption = 'newest' | 'oldest'

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
const selectedUploadFile = ref<File | null>(null)
const uploadingFile = ref(false)
const filesLoading = ref(false)
const transcriptionFiles = ref<UploadedTranscriptionFile[]>([])
const deletingFileId = ref('')
const uploadedFilesSearch = ref('')
const uploadedFilesSort = ref<UploadedFilesSortOption>('newest')
const filesDialogOpen = ref(false)
const expandedFileId = ref('')
let pollTimer: ReturnType<typeof setTimeout> | null = null

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

const canTranscribe = computed(() => {
  if (loading.value) {
    return false
  }

  if (sourceTab.value === 'file') {
    return !!selectedUploadFile.value && !uploadingFile.value
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
  const files = query
    ? transcriptionFiles.value.filter((file) => {
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
    : [...transcriptionFiles.value]

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
    .replace(/[ \t]+/g, ' ')
    .trim()

  if (!normalizedTranscript) {
    return []
  }

  const explicitParagraphs = normalizedTranscript
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs
  }

  const sentences = normalizedTranscript
    .split(/(?<=[.!?])\s+(?=(?:[A-Z0-9"'])|(?:No\b)|(?:But\b)|(?:And\b)|(?:So\b))/)
    .map(sentence => sentence.trim())
    .filter(Boolean)

  if (sentences.length <= 3) {
    return [normalizedTranscript]
  }

  const paragraphs: string[] = []
  let currentParagraph = ''

  for (const sentence of sentences) {
    const nextParagraph = currentParagraph
      ? `${currentParagraph} ${sentence}`
      : sentence

    if (nextParagraph.length > 420 && currentParagraph) {
      paragraphs.push(currentParagraph)
      currentParagraph = sentence
      continue
    }

    currentParagraph = nextParagraph
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph)
  }

  return paragraphs
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
}

const getApiErrorMessage = (error: unknown) => {
  const candidate = error as ApiErrorLike | null

  return candidate?.data?.message
    || candidate?.data?.statusMessage
    || candidate?.statusMessage
    || candidate?.message
    || 'We could not start the transcription workflow right now.'
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

const normalizeUploadedFile = (file: UploadedTranscriptionFile) => ({
  ...file,
  highlights: Array.isArray(file.highlights)
    ? file.highlights
      .map(item => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean)
    : [],
})

const loadUploadedFiles = async () => {
  filesLoading.value = true
  try {
    const headers = await getAuthHeaders()
    const result = await $fetch<UploadedFilesResult>('/api/tools/video-to-text/files', {
      headers,
      query: {
        t: Date.now(),
      },
    })
    transcriptionFiles.value = (result.files ?? []).map(normalizeUploadedFile)
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

const scheduleNextPoll = (delay = 3000) => {
  clearPolling()
  pollTimer = setTimeout(pollStatus, delay)
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

      scheduleNextPoll()
      return
    }

    status.value = result.job.status
    statusSourceTab.value = activeJobSourceTab.value ?? statusSourceTab.value ?? sourceTab.value

    if (result.job.status === 'completed') {
      transcript.value = result.job.transcription || ''
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

    scheduleNextPoll()
  }
  catch (error) {
    console.error('video-to-text status poll failed', error)

    if (pollAttempts.value >= getMaxPollAttempts(transcriber.value)) {
      stopWaitingForCallback()
      return
    }

    scheduleNextPoll(4000)
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
      scheduleNextPoll(2500)
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
  if (!jobId.value) {
    return
  }

  loading.value = true
  callbackPending.value = false
  pollAttempts.value = 0
  statusMessage.value = 'Checking for the latest transcript status...'
  await pollStatus()
}

const handleFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  selectedUploadFile.value = input?.files?.[0] ?? null
}

const uploadAndTranscribeFile = async () => {
  if (!selectedUploadFile.value) {
    toast.error('Choose a file before uploading.')
    return
  }

  uploadingFile.value = true
  errorMessage.value = ''

  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('file', selectedUploadFile.value)
    formData.append('transcriber', transcriber.value)
    formData.append('autoTranscribe', 'true')

    const result = await $fetch<UploadFileResult>('/api/tools/video-to-text/files/upload', {
      method: 'POST',
      headers,
      body: formData,
    })

    if (result.jobId) {
      jobId.value = result.jobId
      status.value = 'processing'
      statusSourceTab.value = 'file'
      activeJobSourceTab.value = 'file'
      loading.value = true
      pollAttempts.value = 0
      callbackPending.value = false
      statusMessage.value = result.message || 'File uploaded and transcription started.'
      scheduleNextPoll(2500)
    }

    selectedUploadFile.value = null
    await loadUploadedFiles()
    toast.success(result.message || 'File uploaded to Supabase Storage.')
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

const transcribeUploadedFile = async (fileId: string) => {
  loading.value = true
  errorMessage.value = ''
  transcript.value = ''
  transcriptSummary.value = ''
  summaryHighlights.value = []
  status.value = 'processing'
  statusSourceTab.value = 'file'
  activeJobSourceTab.value = 'file'
  callbackPending.value = false
  pollAttempts.value = 0

  try {
    const headers = await getAuthHeaders()
    const result = await $fetch<StartTranscriptionResult>('/api/tools/video-to-text/files/' + fileId + '/transcribe', {
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
    scheduleNextPoll(2500)
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

const stopTranscription = () => {
  clearPolling()
  loading.value = false
  callbackPending.value = false
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
        sourceUrl: sourceUrl.value.trim(),
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
              class="h-11 border-border/70 bg-background/90 file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-primary/30"
              @change="handleFileSelection"
            />
            <p class="mt-2 text-xs text-muted-foreground">
              Supported formats: `.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, `.webm` (plus most `audio/*` and `video/*` files).
            </p>
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
            <span>{{ loading || uploadingFile ? 'Transcribing...' : 'Transcribe' }}</span>
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
                  @click="transcribeUploadedFile(file.id)"
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
            Quick overview and key highlights generated from the completed transcript.
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
      <DialogContent class="overflow-hidden rounded-[1.75rem] border-border/70 bg-background/95 p-0 text-foreground shadow-[0_30px_80px_-42px_rgba(0,0,0,0.7)] sm:max-w-5xl">
        <DialogHeader class="border-b border-border/60 px-5 py-4 md:px-6">
          <div class="pr-8">
            <DialogTitle class="text-base font-semibold text-foreground">
              Uploaded files
            </DialogTitle>
            <DialogDescription class="mt-1 text-sm text-muted-foreground">
              Browse, search, sort, preview, and manage your uploaded media files in one canvas modal.
            </DialogDescription>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex w-full items-center gap-2">
              <div class="relative min-w-0 flex-1">
                <Icon
                  name="lucide:search"
                  class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  v-model="uploadedFilesSearch"
                  type="search"
                  placeholder="Search uploaded files..."
                  class="h-10 rounded-lg pl-9"
                />
              </div>

              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    class="size-10 rounded-md"
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
                    class="size-10 rounded-md"
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

            <p class="text-xs text-muted-foreground">
              New uploads are stored in private Supabase Storage and opened with refreshed signed links.
            </p>
          </div>
        </DialogHeader>

        <div class="px-5 py-4 md:px-6 md:py-5">
          <div v-if="filesLoading" class="text-sm text-muted-foreground">
            Loading files...
          </div>
          <div v-else-if="filteredTranscriptionFiles.length === 0" class="text-sm text-muted-foreground">
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
              class="rounded-2xl border border-border/70 bg-card/70 px-4"
            >
              <div class="flex items-start gap-3">
                <AccordionTrigger class="flex-1 py-4 hover:no-underline">
                  <div class="min-w-0 space-y-1 text-left">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="truncate text-sm font-medium text-foreground">
                        {{ file.file_name }}
                      </p>
                      <span class="inline-flex rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {{ file.status }}
                      </span>
                    </div>
                    <p class="text-xs text-muted-foreground">
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
                      :disabled="deletingFileId === file.id"
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
                      @click="transcribeUploadedFile(file.id)"
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
                    <VidstackPreview
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

                  <p v-if="file.error_message" class="text-sm text-destructive">
                    {{ file.error_message }}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
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
