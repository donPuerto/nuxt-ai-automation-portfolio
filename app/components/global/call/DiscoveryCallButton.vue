<script setup lang="ts">
import type { ButtonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type CallStatus = 'idle' | 'preflight' | 'ready' | 'starting' | 'active' | 'ended' | 'error'

type StartCallResponse = {
  ok: boolean
  message: string
  accessToken?: string
}

type DeviceOption = {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  label?: string
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  buttonClass?: string
}>(), {
  label: 'Start a discovery call',
  variant: 'default',
  size: 'default',
  buttonClass: '',
})

const open = ref(false)
const callStatus = ref<CallStatus>('idle')
const statusMessage = ref('We will check your microphone first, then open the call panel and connect you when you are ready.')
const isMuted = ref(false)
const micPermissionGranted = ref(false)
const audioInputDevices = ref<DeviceOption[]>([])
const audioOutputDevices = ref<DeviceOption[]>([])
const selectedInputDeviceId = ref('')
const selectedOutputDeviceId = ref('')
const elapsedSeconds = ref(0)
const audioPreflightStream = ref<MediaStream | null>(null)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const isBusy = computed(() => callStatus.value === 'preflight' || callStatus.value === 'starting')
const isConnected = computed(() => callStatus.value === 'active')
const showSupportState = computed(() => ['ready', 'starting', 'active'].includes(callStatus.value))
const speakerSelectionSupported = computed(() => audioOutputDevices.value.length > 0)

const statusTitle = computed(() => {
  switch (callStatus.value) {
    case 'preflight':
      return 'Checking microphone access'
    case 'ready':
      return ''
    case 'starting':
      return 'Connecting call'
    case 'active':
      return 'Call in progress'
    case 'ended':
      return 'Call ended'
    case 'error':
      return 'Call unavailable'
    default:
      return 'Ready when you are'
  }
})

const formattedDuration = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const pulseBarHeights = computed(() => {
  if (callStatus.value === 'active') {
    return ['h-5', 'h-10', 'h-7', 'h-12', 'h-8']
  }

  if (callStatus.value === 'starting' || callStatus.value === 'preflight') {
    return ['h-3', 'h-6', 'h-4', 'h-7', 'h-5']
  }

  return ['h-2', 'h-4', 'h-3', 'h-4', 'h-2']
})

const orbButtonLabel = computed(() => {
  if (callStatus.value === 'ready') {
    return 'Start call'
  }

  if (callStatus.value === 'error' || callStatus.value === 'ended') {
    return 'Try call again'
  }

  if (callStatus.value !== 'active') {
    return 'Call status indicator'
  }

  return isMuted.value ? 'Unmute microphone' : 'Mute microphone'
})

const orbIsInteractive = computed(() => ['ready', 'active', 'error', 'ended'].includes(callStatus.value))

let retellClient: import('retell-client-js-sdk').RetellWebClient | null = null

const createDeviceLabel = (kind: 'audioinput' | 'audiooutput', index: number) => {
  return kind === 'audioinput' ? `Microphone ${index + 1}` : `Speaker ${index + 1}`
}

const loadAudioDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    audioInputDevices.value = []
    audioOutputDevices.value = []
    return
  }

  const devices = await navigator.mediaDevices.enumerateDevices()

  audioInputDevices.value = devices
    .filter(device => device.kind === 'audioinput')
    .map((device, index) => ({
      value: device.deviceId,
      label: device.label || createDeviceLabel('audioinput', index),
    }))

  audioOutputDevices.value = devices
    .filter(device => device.kind === 'audiooutput')
    .map((device, index) => ({
      value: device.deviceId,
      label: device.label || createDeviceLabel('audiooutput', index),
    }))

  if (!selectedInputDeviceId.value || !audioInputDevices.value.some(device => device.value === selectedInputDeviceId.value)) {
    selectedInputDeviceId.value = audioInputDevices.value[0]?.value || ''
  }

  if (!selectedOutputDeviceId.value || !audioOutputDevices.value.some(device => device.value === selectedOutputDeviceId.value)) {
    selectedOutputDeviceId.value = audioOutputDevices.value[0]?.value || ''
  }
}

const requestAudioStream = async (deviceId?: string) => {
  const audio = deviceId
    ? { deviceId: { exact: deviceId } }
    : true

  audioPreflightStream.value = await navigator.mediaDevices.getUserMedia({ audio })
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const startTimer = () => {
  stopTimer()
  elapsedSeconds.value = 0
  timerInterval.value = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const releasePreflightStream = () => {
  audioPreflightStream.value?.getTracks().forEach(track => track.stop())
  audioPreflightStream.value = null
}

const resetState = () => {
  stopTimer()
  releasePreflightStream()
  callStatus.value = 'idle'
  statusMessage.value = 'We will check your microphone first, then open the call panel and connect you when you are ready.'
  isMuted.value = false
  micPermissionGranted.value = false
  elapsedSeconds.value = 0
  audioInputDevices.value = []
  audioOutputDevices.value = []
  selectedInputDeviceId.value = ''
  selectedOutputDeviceId.value = ''
}

const attachClientEvents = async () => {
  if (retellClient) {
    return retellClient
  }

  const { RetellWebClient } = await import('retell-client-js-sdk')
  retellClient = new RetellWebClient()

  retellClient.on('call_started', () => {
    callStatus.value = 'active'
    statusMessage.value = 'The call is live. Speak naturally and use the controls below if you need to mute or end the session.'
    isMuted.value = false
    startTimer()
  })

  retellClient.on('call_ready', () => {
    statusMessage.value = 'Your AI assistant is ready. You can start speaking now.'
  })

  retellClient.on('call_ended', () => {
    callStatus.value = 'ended'
    statusMessage.value = 'The call has ended. You can start a new call whenever you are ready.'
    isMuted.value = false
    stopTimer()
  })

  retellClient.on('error', (message: unknown) => {
    callStatus.value = 'error'
    stopTimer()
    statusMessage.value = typeof message === 'string'
      ? message
      : 'We could not start the call right now. Please try again in a moment.'
  })

  return retellClient
}

const requestMicrophoneAndOpen = async () => {
  callStatus.value = 'preflight'
  statusMessage.value = 'Checking microphone permission before opening the call panel...'

  try {
    releasePreflightStream()
    await requestAudioStream(selectedInputDeviceId.value || undefined)
    micPermissionGranted.value = true
    await loadAudioDevices()
    callStatus.value = 'ready'
    statusMessage.value = ''
    open.value = true
  }
  catch {
    callStatus.value = 'error'
    statusMessage.value = 'Microphone access is required to start the call. Please allow microphone access and try again.'
    open.value = true
  }
}

const handleInputDeviceChange = async (deviceId: string | null) => {
  if (!deviceId) {
    return
  }

  selectedInputDeviceId.value = deviceId

  if (callStatus.value === 'active' || callStatus.value === 'starting') {
    return
  }

  callStatus.value = 'preflight'
  statusMessage.value = 'Switching to the selected microphone...'

  try {
    releasePreflightStream()
    await requestAudioStream(deviceId || undefined)
    micPermissionGranted.value = true
    await loadAudioDevices()
    callStatus.value = 'ready'
    statusMessage.value = ''
  }
  catch {
    callStatus.value = 'error'
    statusMessage.value = 'We could not switch to that microphone. Please choose another device and try again.'
  }
}

const startCall = async () => {
  callStatus.value = 'starting'
  statusMessage.value = 'Preparing your discovery call and connecting to the assistant...'

  try {
    const client = await attachClientEvents()
    const response = await $fetch<StartCallResponse>('/api/retell/start-web-call', {
      method: 'POST',
    })

    if (!response.ok || !response.accessToken) {
      callStatus.value = 'error'
      statusMessage.value = response.message || 'We could not start the call right now.'
      return
    }

    await client.startCall({
      accessToken: response.accessToken,
      captureDeviceId: selectedInputDeviceId.value || undefined,
      playbackDeviceId: selectedOutputDeviceId.value || undefined,
    })

    try {
      await client.startAudioPlayback()
    }
    catch {
      statusMessage.value = 'The call is connecting. If you do not hear audio, unmute your browser tab and try again.'
    }
  }
  catch (error) {
    console.error('Error starting call', error)
    callStatus.value = 'error'
    statusMessage.value = 'Error starting call'
  }
}

const handlePrimaryAction = async () => {
  if (callStatus.value === 'error' || callStatus.value === 'ended') {
    await requestMicrophoneAndOpen()
    return
  }

  if (callStatus.value === 'ready') {
    await startCall()
    return
  }

  if (callStatus.value === 'idle') {
    await requestMicrophoneAndOpen()
  }
}

const handleOrbAction = async () => {
  if (!orbIsInteractive.value || isBusy.value) {
    return
  }

  if (callStatus.value === 'active') {
    toggleMute()
    return
  }

  await handlePrimaryAction()
}

const toggleMute = () => {
  if (!retellClient || callStatus.value !== 'active') {
    return
  }

  if (isMuted.value) {
    retellClient.unmute()
    isMuted.value = false
    statusMessage.value = 'Microphone is live again.'
  }
  else {
    retellClient.mute()
    isMuted.value = true
    statusMessage.value = 'Your microphone is muted.'
  }
}

const endCall = () => {
  retellClient?.stopCall()
}

watch(open, (isOpen) => {
  if (!isOpen && callStatus.value === 'active') {
    retellClient?.stopCall()
  }

  if (!isOpen && callStatus.value !== 'starting') {
    resetState()
  }
})

onBeforeUnmount(() => {
  stopTimer()
  releasePreflightStream()
  retellClient?.stopCall()
})
</script>

<template>
  <Dialog v-model:open="open">
    <Button :variant="props.variant" :size="props.size" :class="props.buttonClass" @click="requestMicrophoneAndOpen">
      {{ props.label }}
    </Button>

    <DialogContent class="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border-border/60 bg-background/95 p-0 sm:max-w-2xl">
      <div class="border-b border-border/60 bg-gradient-to-br from-primary/12 via-background to-background px-6 py-6">
        <DialogHeader class="space-y-3">
          <DialogTitle class="text-2xl font-semibold tracking-tight text-foreground">
            Start a discovery call
          </DialogTitle>
          <DialogDescription class="sr-only">
            Use this dialog to choose your microphone and speaker, start a discovery call, and manage the live session.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <Card class="overflow-hidden rounded-3xl border-border/60 bg-card/70 shadow-sm">
          <CardContent class="space-y-6 p-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Live call status
                </p>
                <p v-if="statusTitle" class="mt-2 text-2xl font-semibold text-foreground">
                  {{ statusTitle }}
                </p>
                <p v-if="statusMessage" class="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                  {{ statusMessage }}
                </p>
              </div>

              <div class="flex items-center gap-3 self-start">
                <div
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                  :class="isConnected
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : showSupportState
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                      : 'border-border/60 bg-background/70 text-muted-foreground'"
                >
                  <span class="relative flex size-2">
                    <span
                      class="absolute inline-flex h-full w-full rounded-full bg-current opacity-60"
                      :class="isConnected ? 'animate-ping' : ''"
                    />
                    <span class="relative inline-flex size-2 rounded-full bg-current" />
                  </span>
                  {{ isConnected ? 'Live' : callStatus === 'starting' ? 'Connecting' : showSupportState ? 'Ready' : 'Standby' }}
                </div>
              </div>
            </div>

            <div class="rounded-[28px] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div class="flex min-h-48 flex-col items-center justify-center gap-5 text-center">
                <button
                  type="button"
                  class="relative flex size-32 items-center justify-center rounded-full transition-transform duration-200"
                  :class="orbIsInteractive && !isBusy ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]' : 'cursor-default'"
                  :disabled="!orbIsInteractive || isBusy"
                  :aria-label="orbButtonLabel"
                  @click="handleOrbAction"
                >
                  <div
                    v-if="callStatus === 'active'"
                    class="absolute -top-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-primary/25 bg-background/95 px-3 py-1 shadow-sm"
                  >
                    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {{ formattedDuration }}
                    </p>
                  </div>
                  <div
                    class="absolute inset-0 rounded-full bg-primary/15 blur-2xl transition-opacity duration-300"
                    :class="callStatus === 'active' || callStatus === 'starting' ? 'opacity-100' : 'opacity-35'"
                  />
                  <div
                    class="absolute inset-3 rounded-full border border-primary/20"
                    :class="callStatus === 'active' ? 'animate-pulse' : ''"
                  />
                  <div
                    class="absolute inset-0 rounded-full border border-primary/15"
                    :class="callStatus === 'active' ? 'animate-ping' : ''"
                  />
                  <div
                    class="relative flex size-20 items-center justify-center rounded-full border text-primary shadow-[0_0_45px_rgba(34,197,94,0.18)] transition-colors duration-200"
                    :class="callStatus === 'active'
                      ? isMuted
                        ? 'border-amber-400/35 bg-amber-400/15 text-amber-200'
                        : 'border-primary/30 bg-primary/15'
                      : 'border-primary/20 bg-primary/15'"
                  >
                    <Icon
                      :name="callStatus === 'active'
                        ? isMuted
                          ? 'lucide:mic-off'
                          : 'lucide:mic'
                        : callStatus === 'starting'
                          ? 'lucide:phone-call'
                          : 'lucide:mic'"
                      class="size-8"
                    />
                  </div>
                </button>

                <div class="flex items-end gap-2">
                  <div
                    v-for="(barHeight, index) in pulseBarHeights"
                    :key="index"
                    class="w-2 rounded-full bg-primary/70 transition-all duration-300"
                    :class="[barHeight, callStatus === 'active' || callStatus === 'starting' ? 'animate-pulse' : 'opacity-50']"
                    :style="{ animationDelay: `${index * 120}ms` }"
                  />
                </div>

                <div class="grid w-full gap-3 text-left sm:grid-cols-2">
                  <div class="space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                        Microphone
                      </p>
                    </div>

                    <Select
                      v-model="selectedInputDeviceId"
                      @update:model-value="value => handleInputDeviceChange(typeof value === 'string' ? value : null)"
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="device in audioInputDevices"
                          :key="device.value"
                          :value="device.value"
                        >
                          {{ device.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                        Speaker
                      </p>
                    </div>

                    <Select
                      v-if="speakerSelectionSupported"
                      v-model="selectedOutputDeviceId"
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select speaker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="device in audioOutputDevices"
                          :key="device.value"
                          :value="device.value"
                        >
                          {{ device.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div
                      v-else
                      class="rounded-xl border border-dashed border-border/60 bg-background/80 px-3 py-3 text-sm text-muted-foreground"
                    >
                      This browser will use the current system speaker output for playback.
                    </div>
                  </div>
                </div>

                <div
                  v-if="callStatus === 'active'"
                  class="flex w-full flex-col gap-3 pt-2"
                >
                  <Button
                    variant="outline"
                    class="w-full rounded-full"
                    @click="toggleMute"
                  >
                    <Icon :name="isMuted ? 'lucide:mic' : 'lucide:mic-off'" class="size-4" />
                    {{ isMuted ? 'Unmute mic' : 'Mute mic' }}
                  </Button>
                </div>
              </div>
            </div>

            <div
              v-if="callStatus === 'active'"
              class="flex justify-center"
            >
              <Button
                variant="destructive"
                class="min-w-44 rounded-full"
                @click="endCall"
              >
                <Icon name="lucide:phone-off" class="size-4" />
                End call
              </Button>
            </div>

            <div class="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div class="flex items-start gap-3">
                <Icon name="lucide:headphones" class="mt-0.5 size-5 shrink-0 text-primary" />
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-foreground">
                    Best experience
                  </p>
                  <p class="text-sm leading-6 text-muted-foreground">
                    Use headphones if you can, unmute your browser tab, and stay somewhere quiet while the call is active.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter class="border-t border-border/60 px-6 py-5 sm:justify-between">
        <Button variant="ghost" as-child>
          <NuxtLink to="/contact">
            Prefer the contact page?
          </NuxtLink>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
