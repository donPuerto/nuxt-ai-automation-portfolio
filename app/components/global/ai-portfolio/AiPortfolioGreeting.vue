<script setup lang="ts">
import type { AiPortfolioGreetingAnimation } from '@@/shared'
import { animate, stagger } from 'animejs'

const props = withDefaults(defineProps<{
  text: string
  animationType?: AiPortfolioGreetingAnimation
}>(), {
  animationType: 'stagger-chars',
})

const rootRef = ref<HTMLElement | null>(null)

const characters = computed(() => {
  return Array.from(props.text)
})

const supportsCharacterAnimation = computed(() => props.animationType !== 'fade-up')

const runAnimation = async () => {
  await nextTick()

  const root = rootRef.value

  if (!root) {
    return
  }

  if (props.animationType === 'fade-up') {
    const line = root.querySelector<HTMLElement>('[data-line]')

    if (!line) {
      return
    }

    line.style.opacity = '0'
    line.style.transform = 'translateY(22px)'

    animate(line, {
      opacity: [0, 1],
      translateY: [22, 0],
      ease: 'outExpo',
      duration: 1100,
    })

    return
  }

  const chars = root.querySelectorAll<HTMLElement>('[data-char]')

  if (!chars.length) {
    return
  }

  chars.forEach((char) => {
    char.style.opacity = '0'
    char.style.transform = 'translateY(22px)'
    char.style.filter = props.animationType === 'blur-rise' ? 'blur(10px)' : 'blur(0px)'
  })

  animate(chars, {
    opacity: [0, 1],
    translateY: [22, 0],
    filter: props.animationType === 'blur-rise' ? ['blur(10px)', 'blur(0px)'] : ['blur(0px)', 'blur(0px)'],
    delay: stagger(38),
    ease: 'outExpo',
    duration: 850,
  })
}

onMounted(() => {
  runAnimation()
})

watch(
  () => [props.text, props.animationType],
  () => {
    runAnimation()
  },
)
</script>

<template>
  <span ref="rootRef" class="inline-flex">
    <template v-if="supportsCharacterAnimation">
      <span
        v-for="(char, index) in characters"
        :key="`${char}-${index}`"
        data-char
        class="inline-block will-change-transform"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </template>

    <span v-else data-line class="inline-block will-change-transform">
      {{ text }}
    </span>
  </span>
</template>
