<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'

type StartTranscriptionResult = {
  ok: boolean
  jobId?: string
  message: string
  callbackReachable?: boolean
  callbackUrl?: string
}

type VideoToTextTranscriber = 'assemblyai' | 'deepgram' | 'whisper'

type VideoToTextJob = {
  id: string
  status: 'processing' | 'completed' | 'failed'
  sourceUrl: string
  transcription?: string
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

const props = defineProps<{
  project: PortfolioKnowledgeProject
}>()

const sourceUrl = ref('')
const loading = ref(false)
const jobId = ref('')
const status = ref<'idle' | 'processing' | 'completed' | 'failed'>('idle')
const transcript = ref('')
const statusMessage = ref('Paste a YouTube or supported video URL to start transcription.')
const errorMessage = ref('')
const callbackReachable = ref(true)
const callbackUrl = ref('')
const transcriber = ref<VideoToTextTranscriber>('assemblyai')
const pollAttempts = ref(0)
const callbackPending = ref(false)
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

const canSubmit = computed(() => sourceUrl.value.trim().length > 0 && !loading.value)
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
  if (!callbackPending.value) {
    return ''
  }

  return callbackUrl.value
    ? `Still waiting for n8n to POST the finished transcript back to ${callbackUrl.value}.`
    : 'Still waiting for n8n to POST the finished transcript back to the app.'
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

    if (result.job.status === 'completed') {
      transcript.value = result.job.transcription || ''
      statusMessage.value = `Transcript ready via ${result.job.transcriber}.`
      loading.value = false
      callbackPending.value = false
      clearPolling()
      return
    }

    if (result.job.status === 'failed') {
      errorMessage.value = result.job.error || 'The transcription job failed.'
      statusMessage.value = 'Transcription failed.'
      loading.value = false
      callbackPending.value = false
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
  status.value = 'processing'
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
      throw new Error(result.message || 'The transcription workflow could not be started.')
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
    errorMessage.value = error instanceof Error
      ? error.message
      : 'We could not start the transcription workflow right now.'
    statusMessage.value = 'Transcription could not be started.'
  }
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
})

watch(transcriber, (value) => {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem('video-to-text-transcriber', value)
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
        Paste a YouTube or supported video URL, launch the workflow, and read the transcript below once n8n finishes processing.
      </p>
    </div>

    <Card class="rounded-[2rem] border-border/60 bg-card/92 p-5 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.6)] md:p-6">
      <CardContent class="space-y-3 p-0">
        <div class="flex flex-col gap-3 md:flex-row md:items-center">
          <div class="relative flex-1">
            <Input
              v-model="sourceUrl"
              type="url"
              placeholder="Paste a YouTube URL here..."
              class="h-12 rounded-full border-border/70 bg-background/90 pl-5 pr-[11.5rem] text-base shadow-none"
              @keydown.enter.prevent="submitForTranscription"
            />

            <div class="pointer-events-none absolute inset-y-0 right-[8.75rem] my-2 w-px bg-border/60" />

            <div class="absolute inset-y-0 right-3 flex items-center">
              <Select v-model="transcriber">
                <SelectTrigger class="h-9 min-w-[7.75rem] border-0 bg-transparent px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0">
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
            </div>
          </div>

          <Button
            type="button"
            class="h-12 rounded-full px-6 md:px-7"
            :disabled="!canSubmit"
            @click="submitForTranscription"
          >
            <Icon
              v-if="loading"
              name="lucide:loader-circle"
              class="mr-2 size-4 animate-spin"
            />
            <span>{{ loading ? 'Transcribing...' : 'Transcribe' }}</span>
          </Button>
        </div>

      <div class="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <p>{{ statusMessage }}</p>
        <p>
          Request body uses your selected transcriber, the video URL, and the env-backed callback URL.
        </p>
        <p v-if="callbackNotice" class="text-amber-500">
          {{ callbackNotice }}
        </p>
        <p v-if="!callbackReachable" class="text-amber-500">
          Callback delivery needs a public callback URL. Set `NUXT_VIDEO_TO_TEXT_CALLBACK_URL` if you are testing through a tunnel or external endpoint.
        </p>
        <p v-if="errorMessage" class="text-destructive">
          {{ errorMessage }}
        </p>
        <div v-if="callbackPending" class="pt-1">
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
      </CardContent>
    </Card>

    <Card class="rounded-[2rem] border-border/60 bg-background/80 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.6)] md:p-6">
      <CardHeader class="mb-4 flex-row items-center justify-between gap-3 p-0">
        <div class="space-y-1">
          <CardTitle class="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
            Transcript
          </CardTitle>
          <CardDescription class="text-sm text-muted-foreground">
            The finished transcription appears here after the callback completes.
          </CardDescription>
        </div>

        <span class="inline-flex rounded-full border border-border/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground dark:border-white/10 dark:text-[#d1ccc4]/78">
          {{ status }}
        </span>
      </CardHeader>

      <CardContent class="p-0">
        <div class="rounded-[1.5rem] border border-border/70 bg-card/90">
          <ScrollArea class="min-h-[22rem] max-h-[28rem] rounded-[1.5rem]">
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
              class="flex min-h-[22rem] items-center justify-center px-5 py-4 text-center text-sm text-muted-foreground md:min-h-[28rem] md:text-[0.95rem]"
            >
              {{ loading ? 'Waiting for transcription callback...' : 'Your transcript will appear here.' }}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  </section>
</template>
