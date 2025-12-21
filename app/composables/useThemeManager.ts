export const useThemeManager = () => {
  const currentTheme = useState('current-theme', () => {
    if (import.meta.client) {
      return localStorage.getItem('selected-theme') || 'default'
    }
    return 'default'
  })

  const loadTheme = (themeId: string) => {
    if (import.meta.client) {
      // Remove existing theme class
      const html = document.documentElement
      html.classList.forEach(className => {
        if (className.startsWith('theme-')) {
          html.classList.remove(className)
        }
      })

      // Add new theme class
      html.classList.add(`theme-${themeId}`)

      // Save to localStorage
      localStorage.setItem('selected-theme', themeId)
      currentTheme.value = themeId
    }
  }

  // Auto-init theme on client
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('selected-theme') || 'default'
    const html = document.documentElement
    if (!html.classList.contains(`theme-${savedTheme}`)) {
      html.classList.add(`theme-${savedTheme}`)
    }
  }

  return {
    currentTheme,
    loadTheme
  }
}
