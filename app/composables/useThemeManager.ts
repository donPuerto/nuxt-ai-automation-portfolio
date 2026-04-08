import {
  accentPresets,
  cursorPalettes,
  styleThemes,
  type AccentPreset,
  type CursorPalette,
  type FontSelection,
} from '@@/shared'

const THEME_STYLE_ID = 'accent-preset-style'
const FONT_STYLE_ID = 'custom-font-overrides'
const LEGACY_STYLE_IDS = [
  'custom-color-overrides',
  'custom-radius-style',
  'custom-letter-spacing',
]

const getDefaultPreset = (): AccentPreset => {
  const preset = accentPresets.find(item => item.id === 'claude') ?? accentPresets[0]

  if (!preset) {
    throw new Error('Accent presets must define at least one preset.')
  }

  return preset
}

const getPresetById = (presetId: string): AccentPreset => {
  return accentPresets.find(item => item.id === presetId) ?? getDefaultPreset()
}

const getDefaultCursorPalette = (): CursorPalette => {
  const palette = cursorPalettes[0]

  if (!palette) {
    throw new Error('Cursor palettes must define at least one palette.')
  }

  return palette
}

const getCursorPaletteById = (paletteId: string): CursorPalette => {
  return cursorPalettes.find(item => item.id === paletteId) ?? getDefaultCursorPalette()
}

const getDefaultFonts = (): FontSelection => {
  const defaultTheme = styleThemes.find(theme => theme.id === 'claude')

  if (!defaultTheme?.fonts) {
    return {
      sans: '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      serif: '"Anthropic Serif", Georgia, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    }
  }

  return defaultTheme.fonts
}

const buildFontStyles = (fonts: FontSelection) => {
  return `
    :root,
    .theme-container,
    [data-reka-popper-content-wrapper] {
      --font-sans: ${fonts.sans} !important;
      --font-serif: ${fonts.serif} !important;
      --font-mono: ${fonts.mono} !important;
    }
  `
}

const buildPresetStyles = (presetId: string) => {
  const preset = getPresetById(presetId)

  return `
    :root,
    .theme-container,
    [data-reka-popper-content-wrapper] {
      --primary: ${preset.light.primary} !important;
      --primary-foreground: ${preset.light.primaryForeground} !important;
      --ring: ${preset.light.ring} !important;
      --chart-1: ${preset.light.chart1} !important;
      --chart-2: ${preset.light.chart2} !important;
      --chart-3: ${preset.light.chart3} !important;
      --chart-4: ${preset.light.chart4} !important;
      --chart-5: ${preset.light.chart5} !important;
      --sidebar-primary: ${preset.light.sidebarPrimary} !important;
      --sidebar-primary-foreground: ${preset.light.sidebarPrimaryForeground} !important;
      --sidebar-ring: ${preset.light.sidebarRing} !important;
      --selection: ${preset.light.selection} !important;
      --selection-foreground: ${preset.light.selectionForeground} !important;
    }

    .dark,
    .dark .theme-container,
    .dark [data-reka-popper-content-wrapper] {
      --primary: ${preset.dark.primary} !important;
      --primary-foreground: ${preset.dark.primaryForeground} !important;
      --ring: ${preset.dark.ring} !important;
      --chart-1: ${preset.dark.chart1} !important;
      --chart-2: ${preset.dark.chart2} !important;
      --chart-3: ${preset.dark.chart3} !important;
      --chart-4: ${preset.dark.chart4} !important;
      --chart-5: ${preset.dark.chart5} !important;
      --sidebar-primary: ${preset.dark.sidebarPrimary} !important;
      --sidebar-primary-foreground: ${preset.dark.sidebarPrimaryForeground} !important;
      --sidebar-ring: ${preset.dark.sidebarRing} !important;
      --selection: ${preset.dark.selection} !important;
      --selection-foreground: ${preset.dark.selectionForeground} !important;
    }
  `
}

const removeLegacyThemeClasses = () => {
  const html = document.documentElement

  html.classList.forEach((className) => {
    if (className.startsWith('theme-')) {
      html.classList.remove(className)
    }
  })
}

const cleanupLegacyThemeArtifacts = () => {
  removeLegacyThemeClasses()

  for (const styleId of LEGACY_STYLE_IDS) {
    document.getElementById(styleId)?.remove()
  }

  sessionStorage.removeItem('selected-theme')
  sessionStorage.removeItem('selected-radius')
  sessionStorage.removeItem('custom-colors')
  sessionStorage.removeItem('custom-fonts')
  sessionStorage.removeItem('letter-spacing')
}

export const useThemeManager = () => {
  const currentColor = useState('current-color', () => {
    const defaultPreset = getDefaultPreset()

    if (import.meta.client) {
      return sessionStorage.getItem('selected-color') || defaultPreset.id
    }

    return defaultPreset.id
  })

  const currentFonts = useState<FontSelection>('current-fonts', () => {
    const defaults = getDefaultFonts()

    if (import.meta.client) {
      const storedFonts = sessionStorage.getItem('selected-fonts') || sessionStorage.getItem('custom-fonts')

      if (storedFonts) {
        try {
          return {
            ...defaults,
            ...(JSON.parse(storedFonts) as Partial<FontSelection>),
          }
        }
        catch {
          return defaults
        }
      }
    }

    return defaults
  })

  const currentCursor = useState('current-cursor', () => {
    const defaultPalette = getDefaultCursorPalette()

    if (import.meta.client) {
      return sessionStorage.getItem('selected-cursor') || defaultPalette.id
    }

    return defaultPalette.id
  })

  const applyPreset = (presetId: string) => {
    if (!import.meta.client) return

    const preset = getPresetById(presetId)
    let styleElement = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = THEME_STYLE_ID
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = buildPresetStyles(preset.id)
    sessionStorage.setItem('selected-color', preset.id)
    currentColor.value = preset.id
  }

  const applyFonts = (fonts: Partial<FontSelection>) => {
    if (!import.meta.client) return

    const nextFonts = {
      ...getDefaultFonts(),
      ...currentFonts.value,
      ...fonts,
    }

    let styleElement = document.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = FONT_STYLE_ID
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = buildFontStyles(nextFonts)
    sessionStorage.setItem('selected-fonts', JSON.stringify(nextFonts))
    currentFonts.value = nextFonts
  }

  const resetFonts = () => {
    if (!import.meta.client) return

    const defaults = getDefaultFonts()
    document.getElementById(FONT_STYLE_ID)?.remove()
    sessionStorage.removeItem('selected-fonts')
    sessionStorage.removeItem('custom-fonts')
    currentFonts.value = defaults
  }

  const applyCursor = (paletteId: string) => {
    if (!import.meta.client) return

    const palette = getCursorPaletteById(paletteId)
    sessionStorage.setItem('selected-cursor', palette.id)
    currentCursor.value = palette.id
  }

  if (import.meta.client) {
    cleanupLegacyThemeArtifacts()
    applyPreset(currentColor.value)
    applyFonts(currentFonts.value)
    applyCursor(currentCursor.value)
  }

  return {
    currentColor,
    currentFonts,
    currentCursor,
    accentPresets,
    cursorPalettes,
    loadColor: applyPreset,
    loadFonts: applyFonts,
    loadCursor: applyCursor,
    resetFonts,
  }
}
