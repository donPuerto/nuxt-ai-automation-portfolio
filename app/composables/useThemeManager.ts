export const useThemeManager = () => {
  const currentTheme = useState('current-theme', () => {
    if (import.meta.client) {
      return sessionStorage.getItem('selected-theme') || 'default'
    }
    return 'default'
  })

  const currentColor = useState('current-color', () => {
    if (import.meta.client) {
      return sessionStorage.getItem('selected-color') || 'blue'
    }
    return 'blue'
  })

  const currentRadius = useState('current-radius', () => {
    if (import.meta.client) {
      return sessionStorage.getItem('selected-radius') || '0.5'
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

      // Save to sessionStorage
      sessionStorage.setItem('selected-theme', themeId)
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

      // Save to sessionStorage
      sessionStorage.setItem('selected-color', colorId)
      currentColor.value = colorId
    }
  }

  const loadRadius = (radius: string) => {
    if (import.meta.client) {
      // Remove existing radius style if it exists
      const existingStyle = document.getElementById('custom-radius-style')
      if (existingStyle) {
        existingStyle.remove()
      }

      // Create a style element to override radius globally
      const style = document.createElement('style')
      style.id = 'custom-radius-style'
      style.textContent = `
        .theme-container,
        [data-reka-popper-content-wrapper] {
          --radius: ${radius}rem !important;
        }
      `
      document.head.appendChild(style)

      sessionStorage.setItem('selected-radius', radius)
      currentRadius.value = radius
    }
  }

  // Auto-init on client
  if (import.meta.client) {
    const savedTheme = sessionStorage.getItem('selected-theme') || 'default'
    const savedColor = sessionStorage.getItem('selected-color') || 'blue'
    const savedRadius = sessionStorage.getItem('selected-radius') || '0.5'
    
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
    const style = document.createElement('style')
    style.id = 'custom-radius-style'
    style.textContent = `
      .theme-container,
      [data-reka-popper-content-wrapper] {
        --radius: ${savedRadius}rem !important;
      }
    `
    document.head.appendChild(style)
    
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
