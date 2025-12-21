// System Prompt: This project uses Nuxt 4, Tailwind CSS 4, Inspira UI, and shadcn/ui.
// Always use <script setup> by default in Vue components.
// For setup instructions, see .cursorrules or README.md.

// Theme composable with visible circular ripple wave transition for mode changes
export const useTheme = () => {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  const toggleTheme = (event?: MouseEvent) => {
    if (import.meta.client) {
      // Use click coordinates if available, otherwise fallback to top-right
      const x = event?.clientX ?? window.innerWidth - 100
      const y = event?.clientY ?? 50

      // Calculate the radius needed to cover the entire viewport
      const maxX = Math.max(x, window.innerWidth - x)
      const maxY = Math.max(y, window.innerHeight - y)
      const endRadius = Math.sqrt(maxX * maxX + maxY * maxY) * 1.5

      // Determine target theme
      const isDarkMode = colorMode.value === 'dark'
      
      // Create full-screen canvas overlay
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

      // Animation
      let startTime: number | null = null
      const duration = 400
      let hasChangedTheme = false
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Ease-out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const currentRadius = easeProgress * endRadius
        
        // Draw expanding circle
        ctx.beginPath()
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = isDarkMode ? '#fafafa' : '#0f0f0f'
        ctx.shadowBlur = 30
        ctx.shadowColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
        ctx.fill()
        
        // Change theme at 40% progress
        if (progress >= 0.4 && !hasChangedTheme) {
          colorMode.preference = isDarkMode ? 'light' : 'dark'
          hasChangedTheme = true
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          canvas.remove()
        }
      }
      
      requestAnimationFrame(animate)
    } else {
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    }
  }

  return {
    isDark: readonly(isDark),
    toggleTheme,
    colorMode
  }
}