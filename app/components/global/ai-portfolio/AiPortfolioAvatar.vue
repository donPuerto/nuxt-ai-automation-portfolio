<script setup lang="ts">
import * as THREE from 'three'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const hostRef = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera | null = null
let scene: THREE.Scene | null = null
let ghostGroup: THREE.Group | null = null
let ghostBody: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null = null
let leftEye: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
let rightEye: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
let leftOuterGlow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
let rightOuterGlow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | null = null
let frame = 0
let start = 0

const mouse = reactive({ x: 0, y: 0 })
const target = reactive({ x: 0, y: 0 })
const glowOpacity = ref(0)
let removeWindowPointer: (() => void) | null = null

const frameSizeClass = computed(() =>
  props.compact ? 'size-36 md:size-40' : 'size-48 md:size-56'
)

const canvasSizeClass = computed(() =>
  props.compact ? 'size-88 md:size-96' : 'size-[29rem] md:size-[33rem]'
)

const ghostScale = computed(() =>
  props.compact ? 0.5 : 0.62
)

const horizontalTravel = computed(() =>
  props.compact ? 1.95 : 2.35
)

const verticalTravel = computed(() =>
  props.compact ? 1.25 : 1.55
)

const fluorescentColors = {
  orange: 0xff4500,
  green: 0x00ff80,
}

const handlePointerMove = (event: PointerEvent) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1
  const y = -((event.clientY / window.innerHeight) * 2 - 1)

  target.x = THREE.MathUtils.clamp(x, -1, 1)
  target.y = THREE.MathUtils.clamp(y, -1, 1)
}

const resetPointer = () => {
  target.x = 0
  target.y = 0
}

const resizeScene = () => {
  if (!hostRef.value || !renderer || !camera) {
    return
  }

  const { width, height } = hostRef.value.getBoundingClientRect()
  const safeWidth = Math.max(width, 1)
  const safeHeight = Math.max(height, 1)

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(safeWidth, safeHeight, false)
  camera.aspect = safeWidth / safeHeight
  camera.updateProjectionMatrix()
}

const buildGhost = () => {
  const geometry = new THREE.SphereGeometry(2, 40, 40)
  const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i)
    const y = positionAttribute.getY(i)
    const z = positionAttribute.getZ(i)

    if (y < -0.15) {
      const noise1 = Math.sin(x * 5) * 0.35
      const noise2 = Math.cos(z * 4) * 0.25
      const noise3 = Math.sin((x + z) * 3) * 0.15
      positionAttribute.setY(i, -2 + noise1 + noise2 + noise3)
    }
  }

  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    color: 0x131313,
    emissive: fluorescentColors.orange,
    emissiveIntensity: 4.8,
    transparent: true,
    opacity: 0.88,
    roughness: 0.06,
    metalness: 0,
    side: THREE.DoubleSide,
  })

  ghostBody = new THREE.Mesh(geometry, material)
  ghostGroup = new THREE.Group()
  ghostGroup.add(ghostBody)

  const socketGeometry = new THREE.SphereGeometry(0.46, 20, 20)
  const socketMaterial = new THREE.MeshBasicMaterial({ color: 0x050505 })

  const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial)
  leftSocket.position.set(-0.72, 0.58, 1.92)
  leftSocket.scale.set(1.08, 1, 0.55)
  ghostGroup.add(leftSocket)

  const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial)
  rightSocket.position.set(0.72, 0.58, 1.92)
  rightSocket.scale.set(1.08, 1, 0.55)
  ghostGroup.add(rightSocket)

  const eyeGeometry = new THREE.SphereGeometry(0.3, 18, 18)
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: fluorescentColors.green,
    transparent: true,
    opacity: 0,
  })

  leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone())
  leftEye.position.set(-0.72, 0.58, 2.06)
  ghostGroup.add(leftEye)

  rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone())
  rightEye.position.set(0.72, 0.58, 2.06)
  ghostGroup.add(rightEye)

  const outerGeometry = new THREE.SphereGeometry(0.54, 18, 18)
  const outerMaterial = new THREE.MeshBasicMaterial({
    color: fluorescentColors.green,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
  })

  leftOuterGlow = new THREE.Mesh(outerGeometry, outerMaterial.clone())
  leftOuterGlow.position.set(-0.72, 0.58, 2.02)
  ghostGroup.add(leftOuterGlow)

  rightOuterGlow = new THREE.Mesh(outerGeometry, outerMaterial.clone())
  rightOuterGlow.position.set(0.72, 0.58, 2.02)
  ghostGroup.add(rightOuterGlow)

  ghostGroup.scale.setScalar(ghostScale.value)
  return ghostGroup
}

const animate = (timestamp: number) => {
  if (!renderer || !scene || !camera || !ghostGroup || !ghostBody || !leftEye || !rightEye || !leftOuterGlow || !rightOuterGlow) {
    return
  }

  if (!start) {
    start = timestamp
  }

  const elapsed = (timestamp - start) / 1000
  mouse.x = THREE.MathUtils.lerp(mouse.x, target.x, 0.08)
  mouse.y = THREE.MathUtils.lerp(mouse.y, target.y, 0.08)

  const movement = Math.abs(mouse.x) + Math.abs(mouse.y)
  glowOpacity.value = THREE.MathUtils.lerp(glowOpacity.value, movement > 0.04 ? 1 : 0.08, movement > 0.04 ? 0.16 : 0.06)

  ghostGroup.position.x = mouse.x * horizontalTravel.value + Math.sin(elapsed * 1.2) * 0.14
  ghostGroup.position.y = mouse.y * verticalTravel.value + Math.cos(elapsed * 1.6) * 0.14
  ghostGroup.rotation.z = mouse.x * 0.28 + Math.sin(elapsed * 1.4) * 0.04
  ghostGroup.rotation.x = -mouse.y * 0.16
  ghostGroup.rotation.y = mouse.x * 0.22

  ghostBody.rotation.y = Math.sin(elapsed * 1.1) * 0.08
  ghostBody.scale.y = 1 + Math.sin(elapsed * 2) * 0.025
  ghostBody.scale.x = 1 - Math.sin(elapsed * 2) * 0.02

  const pulse = 4.8 + Math.sin(elapsed * 2.8) * 0.55 + movement * 1.4
  ghostBody.material.emissiveIntensity = pulse

  const eyeX = mouse.x * 0.14
  const eyeY = mouse.y * 0.12
  const eyeScale = 1 + movement * 0.12 + Math.sin(elapsed * 3.1) * 0.03

  leftEye.position.x = -0.72 + eyeX
  leftEye.position.y = 0.58 + eyeY
  rightEye.position.x = 0.72 + eyeX
  rightEye.position.y = 0.58 + eyeY
  leftOuterGlow.position.x = -0.72 + eyeX
  leftOuterGlow.position.y = 0.58 + eyeY
  rightOuterGlow.position.x = 0.72 + eyeX
  rightOuterGlow.position.y = 0.58 + eyeY

  leftEye.scale.setScalar(eyeScale)
  rightEye.scale.setScalar(eyeScale)
  leftOuterGlow.scale.setScalar(eyeScale)
  rightOuterGlow.scale.setScalar(eyeScale)

  leftEye.material.opacity = glowOpacity.value
  rightEye.material.opacity = glowOpacity.value
  leftOuterGlow.material.opacity = glowOpacity.value * 0.34
  rightOuterGlow.material.opacity = glowOpacity.value * 0.34

  renderer.render(scene, camera)
  frame = window.requestAnimationFrame(animate)
}

onMounted(() => {
  if (!hostRef.value) {
    return
  }

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0, 11.4)

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.className = 'h-full w-full'
  renderer.domElement.style.background = 'transparent'
  renderer.domElement.style.filter = 'drop-shadow(0 0 22px rgba(255, 108, 34, 0.45)) drop-shadow(0 0 48px rgba(255, 72, 0, 0.32))'
  hostRef.value.appendChild(renderer.domElement)

  const ambient = new THREE.AmbientLight(0x201712, 0.22)
  scene.add(ambient)

  const rimLight = new THREE.DirectionalLight(0xffb07a, 1.4)
  rimLight.position.set(-4, 5, 4)
  scene.add(rimLight)

  const tealLight = new THREE.DirectionalLight(0x63ffd1, 0.38)
  tealLight.position.set(5, -3, 3)
  scene.add(tealLight)

  const ghostGlow = new THREE.PointLight(0xff5a1f, 10, 16, 1.6)
  ghostGlow.position.set(0, 0.5, 5)
  scene.add(ghostGlow)

  const eyeGlow = new THREE.PointLight(0x73ff9f, 2.8, 7, 2)
  eyeGlow.position.set(0, 0.6, 4.5)
  scene.add(eyeGlow)

  scene.add(buildGhost())
  resizeScene()
  frame = window.requestAnimationFrame(animate)

  window.addEventListener('resize', resizeScene)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerleave', resetPointer)
  removeWindowPointer = () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerleave', resetPointer)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeScene)
  removeWindowPointer?.()
  window.cancelAnimationFrame(frame)
  renderer?.dispose()

  if (hostRef.value && renderer?.domElement && hostRef.value.contains(renderer.domElement)) {
    hostRef.value.removeChild(renderer.domElement)
  }
})
</script>

<template>
  <div class="relative flex justify-center">
    <div class="relative" :class="frameSizeClass">
      <div
        ref="hostRef"
        class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
        :class="canvasSizeClass"
      />
    </div>
  </div>
</template>
