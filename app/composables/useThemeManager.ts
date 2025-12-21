export const useThemeManager = () => {
  const currentTheme = useState('current-theme', () => {
    if (import.meta.client) {
      return localStorage.getItem('selected-theme') || 'default'
    }
    return 'default'
  })

  const currentColor = useState('current-color', () => {
    if (import.meta.client) {
      return localStorage.getItem('selected-color') || 'blue'
    }
    return 'blue'
  })

  const currentRadius = useState('current-radius', () => {
    if (import.meta.client) {
      return localStorage.getItem('selected-radius') || '0.5'
    }
    return '0.5'
  })

  const loadTheme = (themeId: string) => {
    if (import.meta.client) {
      // Remove existing theme class
      const html = document.documentElement
      html.classList.forEach(className => {
        if (className.startsWith('theme-') && !className.startsWith('theme-color-')) {
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

  const loadColor = (colorId: string) => {
    if (import.meta.client) {
      const html = document.documentElement
      // Remove existing color theme class
      html.classList.forEach(className => {
        if (className.startsWith('theme-') && ['zinc', 'rose', 'blue', 'green', 'orange', 'red', 'slate', 'stone', 'gray', 'neutral', 'yellow', 'violet', 'amber', 'purple', 'teal'].some(c => className === `theme-${c}`)) {
          html.classList.remove(className)
        }
      })

      // Add new color theme class
      html.classList.add(`theme-${colorId}`)

      // Save to localStorage
      localStorage.setItem('selected-color', colorId)
      currentColor.value = colorId
    }
  }

  const loadRadius = (radius: string) => {
    if (import.meta.client) {
      const html = document.documentElement
      html.style.setProperty('--radius', `${radius}rem`)
      localStorage.setItem('selected-radius', radius)
      currentRadius.value = radius
    }
  }

  // Auto-init on client
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('selected-theme') || 'default'
    const savedColor = localStorage.getItem('selected-color') || 'blue'
    const savedRadius = localStorage.getItem('selected-radius') || '0.5'
    
    const html = document.documentElement
    
    // Apply theme
    if (!html.classList.contains(`theme-${savedTheme}`)) {
      html.classList.add(`theme-${savedTheme}`)
    }
    
    // Apply color
    if (!html.classList.contains(`theme-${savedColor}`)) {
      html.classList.add(`theme-${savedColor}`)
    }
    
    // Apply radius
    html.style.setProperty('--radius', `${savedRadius}rem`)
    
    currentTheme.value = savedTheme
    currentColor.value = savedColor
    currentRadius.value = savedRadius
  }

  return {
    currentTheme,
    currentColor,
    currentRadius,
    loadTheme,
    loadColor,
    loadRadius
  }
}
