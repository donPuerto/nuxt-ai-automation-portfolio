<template>
  <canvas
    ref="canvasRef"
    :width="size"
    :height="size"
    :style="{ width: `${size}px`, height: `${size}px`, display: 'block' }"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number
  seed?: number
  numSpikes?: number
  speed?: number
  colors?: string[]
}>(), {
  size: 320,
  seed: 42,
  numSpikes: 7,
  speed: 1,
  colors: () => ['#D97757', '#E08A6A', '#C86A4A', '#D4734F', '#E89070', '#BF6040', '#D07050'],
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function initAndAnimate() {
  const canvas = canvasRef.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return
  const ctx: CanvasRenderingContext2D = context

  const width = props.size
  const cx = width / 2
  const cy = width / 2
  const rand = mulberry32(props.seed)

  const spikes = Array.from({ length: props.numSpikes }, (_, index) => ({
    angle: ((Math.PI * 2) / props.numSpikes) * index,
    outerBase: (width * 0.3) + (rand() - 0.5) * (width * 0.12),
    innerBase: (width * 0.1) + (rand() - 0.5) * (width * 0.03),
    speed: 1.5 + rand() * 1.5,
    phase: rand() * Math.PI * 2,
    widthFactor: 0.34 + rand() * 0.16,
    pulseAmp: (width * 0.045) + rand() * (width * 0.07),
    color: props.colors[index % props.colors.length]!,
  }))

  const particles = Array.from({ length: 10 }, (_, index) => ({
    angleOffset: ((Math.PI * 2) / 10) * index,
    dist: width * 0.36 + (rand() - 0.5) * (width * 0.06),
    orbitSpeed: 0.4 + rand() * 0.3,
    pulsePhase: rand() * Math.PI * 2,
    size: (width * 0.012) + rand() * (width * 0.005),
  }))

  let time = 0
  let globalRotation = 0

  function drawSpike(spike: typeof spikes[number], t: number) {
    const pulse = Math.sin(t * spike.speed + spike.phase)
    const outerR = spike.outerBase + pulse * spike.pulseAmp
    const innerR = spike.innerBase + pulse * 2
    const halfWidth = spike.widthFactor * innerR
    const angle = spike.angle + globalRotation + Math.sin(t * 0.8 + spike.phase) * 0.06

    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const cosP = Math.cos(angle + Math.PI / 2)
    const sinP = Math.sin(angle + Math.PI / 2)

    const tipX = cx + cosA * outerR
    const tipY = cy + sinA * outerR
    const baseX = cx + cosA * innerR
    const baseY = cy + sinA * innerR

    const leftX = baseX + cosP * halfWidth
    const leftY = baseY + sinP * halfWidth
    const rightX = baseX - cosP * halfWidth
    const rightY = baseY - sinP * halfWidth

    const cpDist = outerR * 0.55
    const cpX = cx + cosA * cpDist
    const cpY = cy + sinA * cpDist

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(leftX, leftY)
    ctx.quadraticCurveTo(cpX + cosP * halfWidth * 0.4, cpY + sinP * halfWidth * 0.4, tipX, tipY)
    ctx.quadraticCurveTo(cpX - cosP * halfWidth * 0.4, cpY - sinP * halfWidth * 0.4, rightX, rightY)
    ctx.closePath()
    ctx.fillStyle = spike.color
    ctx.fill()
  }

  function drawCenter(t: number) {
    const r = width * 0.0375 + Math.sin(t * 3) * (width * 0.006)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = props.colors[0] || '#D97757'
    ctx.fill()
  }

  function drawParticles(t: number) {
    for (const particle of particles) {
      const angle = particle.angleOffset + t * particle.orbitSpeed
      const dist = particle.dist + Math.sin(t * 1.6 + particle.pulsePhase) * (width * 0.036)
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      const size = particle.size + Math.sin(t * 2.5 + particle.pulsePhase) * (width * 0.002)
      const alpha = 0.3 + Math.sin(t * 1.5 + particle.pulsePhase) * 0.2
      ctx.beginPath()
      ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(217,119,87,${alpha})`
      ctx.fill()
    }
  }

  function animateFrame() {
    time += 0.025 * props.speed
    globalRotation += 0.008 * props.speed
    ctx.clearRect(0, 0, width, width)
    drawParticles(time)
    const sortedSpikes = [...spikes].sort(
      (a, b) => Math.sin(time * a.speed + a.phase) - Math.sin(time * b.speed + b.phase),
    )
    sortedSpikes.forEach(spike => drawSpike(spike, time))
    drawCenter(time)
    animId = requestAnimationFrame(animateFrame)
  }

  animateFrame()
}

onMounted(() => {
  initAndAnimate()
})

onUnmounted(() => {
  if (animId !== null) {
    cancelAnimationFrame(animId)
  }
})

watch(
  () => [props.size, props.seed, props.numSpikes, props.speed, props.colors.join('|')],
  () => {
    if (animId !== null) {
      cancelAnimationFrame(animId)
    }
    initAndAnimate()
  },
)
</script>
