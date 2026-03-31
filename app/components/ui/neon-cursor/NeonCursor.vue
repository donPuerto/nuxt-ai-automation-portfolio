<script setup lang="ts">
import { cursorPalettes } from '@@/shared'

type TrailPoint = {
  x: number
  y: number
  age: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const colorMode = useColorMode()
const { currentCursor } = useThemeManager()

const prefersReducedMotion = ref(false)
const isCoarsePointer = ref(false)
const isActive = computed(() => !prefersReducedMotion.value && !isCoarsePointer.value)

let frame = 0
let context: CanvasRenderingContext2D | null = null
let lastTimestamp = 0
let resizeHandler: (() => void) | null = null
let pointerMoveHandler: ((event: PointerEvent) => void) | null = null
let pointerLeaveHandler: (() => void) | null = null
let motionQuery: MediaQueryList | null = null
let pointerQuery: MediaQueryList | null = null

const pointer = reactive({
  x: 0,
  y: 0,
  visible: false,
})

const trail = ref<TrailPoint[]>([])

const buildOffsetPoints = (points: TrailPoint[], distance: number) => {
  return points.map((point, index) => {
    const previous = points[index - 1] ?? point
    const next = points[index + 1] ?? point
    const dx = next.x - previous.x
    const dy = next.y - previous.y
    const length = Math.hypot(dx, dy) || 1

    return {
      x: point.x + (-dy / length) * distance,
      y: point.y + (dx / length) * distance,
    }
  })
}

const drawTrailPath = (
  points: Array<{ x: number, y: number }>,
  width: number,
  blur: number,
  strokeStops: [number, string][],
) => {
  if (!context || points.length < 2) {
    return
  }

  const gradient = context.createLinearGradient(
    points[points.length - 1]!.x,
    points[points.length - 1]!.y,
    points[0]!.x,
    points[0]!.y,
  )

  for (const [offset, color] of strokeStops) {
    gradient.addColorStop(offset, color)
  }

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = gradient
  context.shadowBlur = blur
  context.shadowColor = strokeStops[1]?.[1] ?? strokeStops[0]![1]
  context.lineWidth = width
  context.beginPath()
  context.moveTo(points[0]!.x, points[0]!.y)

  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i]!
    const next = points[i + 1]!
    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    context.quadraticCurveTo(current.x, current.y, midX, midY)
  }

  const last = points[points.length - 1]!
  context.lineTo(last.x, last.y)
  context.stroke()
  context.restore()
}

const fallbackPalette = cursorPalettes[0]

if (!fallbackPalette) {
  throw new Error('At least one cursor palette must be available.')
}

const palette = computed(() => {
  const selected = cursorPalettes.find(item => item.id === currentCursor.value) ?? fallbackPalette
  return colorMode.value === 'dark' ? selected.dark : selected.light
})

const syncEnvironmentPreferences = () => {
  prefersReducedMotion.value = motionQuery?.matches ?? false
  isCoarsePointer.value = pointerQuery?.matches ?? false
}

const resizeCanvas = () => {
  if (!canvasRef.value || !context) {
    return
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight

  canvasRef.value.width = Math.floor(width * dpr)
  canvasRef.value.height = Math.floor(height * dpr)
  canvasRef.value.style.width = `${width}px`
  canvasRef.value.style.height = `${height}px`
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
}

const drawFrame = (timestamp: number) => {
  if (!context || !canvasRef.value) {
    return
  }

  const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.032) : 0.016
  lastTimestamp = timestamp

  context.clearRect(0, 0, window.innerWidth, window.innerHeight)

  trail.value = trail.value
    .map(point => ({ ...point, age: point.age + delta }))
    .filter(point => point.age < 0.62)

  if (trail.value.length > 1) {
    const basePoints = trail.value.map(point => ({ x: point.x, y: point.y }))
    const sideOffset = colorMode.value === 'dark' ? 7 : 5
    const leftPoints = buildOffsetPoints(trail.value, -sideOffset)
    const rightPoints = buildOffsetPoints(trail.value, sideOffset)

    drawTrailPath(
      basePoints,
      colorMode.value === 'dark' ? 7.5 : 6,
      colorMode.value === 'dark' ? 30 : 18,
      [
        [0, palette.value.mainTrail[2]!],
        [0.55, palette.value.mainTrail[1]!],
        [1, palette.value.mainTrail[0]!],
      ],
    )

    drawTrailPath(
      leftPoints,
      colorMode.value === 'dark' ? 2.8 : 2.2,
      colorMode.value === 'dark' ? 12 : 8,
      [
        [0, palette.value.sideTrailA[2]!],
        [0.6, palette.value.sideTrailA[1]!],
        [1, 'rgba(0,0,0,0)'],
      ],
    )

    drawTrailPath(
      rightPoints,
      colorMode.value === 'dark' ? 2.1 : 1.8,
      colorMode.value === 'dark' ? 10 : 7,
      [
        [0, palette.value.sideTrailB[2]!],
        [0.58, palette.value.sideTrailB[1]!],
        [1, 'rgba(0,0,0,0)'],
      ],
    )
  }

  if (pointer.visible) {
    context.save()
    context.fillStyle = palette.value.glow
    context.beginPath()
    context.arc(pointer.x, pointer.y, colorMode.value === 'dark' ? 12 : 9, 0, Math.PI * 2)
    context.fill()

    context.strokeStyle = palette.value.ring
    context.lineWidth = 1.35
    context.beginPath()
    context.arc(pointer.x, pointer.y, colorMode.value === 'dark' ? 7.25 : 6.25, 0, Math.PI * 2)
    context.stroke()

    context.fillStyle = palette.value.core
    context.beginPath()
    context.arc(pointer.x, pointer.y, 2.3, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  frame = window.requestAnimationFrame(drawFrame)
}

const startCursor = () => {
  if (!canvasRef.value || !isActive.value) {
    return
  }

  context = canvasRef.value.getContext('2d')

  if (!context) {
    return
  }

  resizeCanvas()
  window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(drawFrame)
}

const stopCursor = () => {
  window.cancelAnimationFrame(frame)
  frame = 0
  lastTimestamp = 0
  trail.value = []

  if (context) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}

watch(isActive, active => {
  if (active) {
    startCursor()
    return
  }

  stopCursor()
})

watch(() => colorMode.value, () => {
  if (!context || !isActive.value) {
    return
  }

  resizeCanvas()
})

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  pointerQuery = window.matchMedia('(pointer: coarse)')
  syncEnvironmentPreferences()

  motionQuery.addEventListener('change', syncEnvironmentPreferences)
  pointerQuery.addEventListener('change', syncEnvironmentPreferences)

  resizeHandler = () => resizeCanvas()
  pointerMoveHandler = (event: PointerEvent) => {
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.visible = true

    trail.value.push({
      x: event.clientX,
      y: event.clientY,
      age: 0,
    })

    if (trail.value.length > 18) {
      trail.value.shift()
    }
  }
  pointerLeaveHandler = () => {
    pointer.visible = false
  }

  window.addEventListener('resize', resizeHandler)
  window.addEventListener('pointermove', pointerMoveHandler, { passive: true })
  window.addEventListener('pointerleave', pointerLeaveHandler)

  startCursor()
})

onUnmounted(() => {
  stopCursor()

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }

  if (pointerMoveHandler) {
    window.removeEventListener('pointermove', pointerMoveHandler)
  }

  if (pointerLeaveHandler) {
    window.removeEventListener('pointerleave', pointerLeaveHandler)
  }

  motionQuery?.removeEventListener('change', syncEnvironmentPreferences)
  pointerQuery?.removeEventListener('change', syncEnvironmentPreferences)
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-40 overflow-hidden">
    <canvas
      v-show="isActive"
      ref="canvasRef"
      class="block size-full"
      data-neon-cursor
      aria-hidden="true"
    />
  </div>
</template>
