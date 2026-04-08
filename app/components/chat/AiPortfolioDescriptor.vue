<script setup lang="ts">
import { animate } from 'animejs'

const props = defineProps<{
  texts: string[]
}>()

const descriptorRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const activeText = ref(props.texts[0] ?? '')
const rotationTimer = ref<ReturnType<typeof setInterval> | null>(null)

const descriptorTexts = computed(() => {
  return props.texts.filter(Boolean)
})

const animateCurrentText = async () => {
  await nextTick()

  const descriptor = descriptorRef.value
  const content = contentRef.value

  if (!descriptor || !content || !activeText.value) {
    return
  }

  content.style.opacity = '0'
  content.style.transform = 'translateY(8px)'

  animate(descriptor, {
    opacity: [0.72, 1],
    textShadow: [
      '0 0 0 rgba(242,214,191,0)',
      '0 0 20px rgba(242,214,191,0.18)',
    ],
    duration: 900,
    ease: 'inOutSine',
  })

  animate(content, {
    opacity: [0, 1],
    translateY: [8, 0],
    ease: 'outExpo',
    duration: 520,
  })
}

const stopRotation = () => {
  if (rotationTimer.value) {
    clearInterval(rotationTimer.value)
    rotationTimer.value = null
  }
}

const startRotation = () => {
  stopRotation()

  if (!descriptorTexts.value.length) {
    activeText.value = ''
    return
  }

  let index = 0
  activeText.value = descriptorTexts.value[index]!
  void animateCurrentText()

  if (descriptorTexts.value.length === 1) {
    return
  }

  rotationTimer.value = setInterval(() => {
    index = (index + 1) % descriptorTexts.value.length
    activeText.value = descriptorTexts.value[index]!
    void animateCurrentText()
  }, 2800)
}

onMounted(() => {
  startRotation()
})

watch(
  () => props.texts,
  () => {
    activeText.value = props.texts[0] ?? ''
    startRotation()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  stopRotation()
})
</script>

<template>
  <p
    ref="descriptorRef"
    class="min-h-[1.5rem] text-sm text-muted-foreground md:min-h-[1.65rem] md:text-base"
    data-ai-portfolio-descriptor
  >
    <span
      ref="contentRef"
      class="inline-block max-w-[min(92vw,40rem)] whitespace-nowrap align-bottom text-foreground/76"
    >{{ activeText }}</span>
  </p>
</template>
