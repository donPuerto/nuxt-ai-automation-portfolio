// System Prompt: This project uses Nuxt 4, Tailwind CSS 4, Inspira UI, and shadcn/ui.
// Always use <script setup> by default in Vue components.
// For setup instructions, see .cursorrules or README.md.

// Theme composable with visible circular ripple wave transition for mode changes
export const useTheme = () => {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  const animateThemeChange = (targetMode: 'light' | 'dark', event?: MouseEvent) => {
    if (!import.meta.client) {
      colorMode.preference = targetMode
      return
    }

    if (colorMode.value === targetMode) {
      return
    }

    const x = event?.clientX ?? window.innerWidth - 100
    const y = event?.clientY ?? 50
    const maxX = Math.max(x, window.innerWidth - x)
    const maxY = Math.max(y, window.innerHeight - y)
    const endRadius = Math.sqrt(maxX * maxX + maxY * maxY) * 1.5

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 50000;
    `

    document.body.appendChild(canvas)

    let startTime: number | null = null
    const duration = 400
    let hasChangedTheme = false

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const radius = easeProgress * endRadius

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = targetMode === 'light' ? '#fafafa' : '#0f0f0f'
      ctx.shadowBlur = 30
      ctx.shadowColor = targetMode === 'light'
        ? 'rgba(255, 255, 255, 0.5)'
        : 'rgba(0, 0, 0, 0.5)'
      ctx.fill()

      if (progress >= 0.4 && !hasChangedTheme) {
        colorMode.preference = targetMode
        hasChangedTheme = true
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        canvas.remove()
      }
    }

    requestAnimationFrame(animate)
  }

  const toggleTheme = (event?: MouseEvent) => {
    animateThemeChange(colorMode.value === 'dark' ? 'light' : 'dark', event)
  }

  const setTheme = (mode: 'light' | 'dark', event?: MouseEvent) => {
    animateThemeChange(mode, event)
  }

  return {
    isDark: readonly(isDark),
    toggleTheme,
    setTheme,
    colorMode
  }
}
