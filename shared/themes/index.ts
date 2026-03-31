export interface ThemeConfig {
  id: string
  name: string
  label: string
  icon: string
  fonts?: {
    sans: string
    serif: string
    mono: string
  }
}

export interface RadiusOption {
  value: string
  label: string
}

export interface FontOption {
  value: string
  label: string
  family: string
}

export interface FontSelection {
  sans: string
  serif: string
  mono: string
}

export interface CursorPaletteMode {
  core: string
  glow: string
  ring: string
  mainTrail: [string, string, string]
  sideTrailA: [string, string, string]
  sideTrailB: [string, string, string]
}

export interface CursorPalette {
  id: string
  label: string
  swatch: string
  light: CursorPaletteMode
  dark: CursorPaletteMode
}

export interface AccentPreset {
  id: string
  label: string
  swatch: string
  light: {
    primary: string
    primaryForeground: string
    ring: string
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarRing: string
    selection: string
    selectionForeground: string
  }
  dark: {
    primary: string
    primaryForeground: string
    ring: string
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string
    sidebarPrimary: string
    sidebarPrimaryForeground: string
    sidebarRing: string
    selection: string
    selectionForeground: string
  }
}

// Font options for customization
export const fontSansOptions: FontOption[] = [
  { value: 'anthropic-sans', label: 'Anthropic Sans', family: '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { value: 'system-ui', label: 'System UI', family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' },
  { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'plus-jakarta', label: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans, sans-serif' },
  { value: 'nunito', label: 'Nunito', family: 'Nunito, sans-serif' },
  { value: 'quicksand', label: 'Quicksand', family: 'Quicksand, sans-serif' },
  { value: 'orbitron', label: 'Orbitron', family: 'Orbitron, sans-serif' },
  { value: 'geist', label: 'Geist', family: 'Geist, sans-serif' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'dm-sans', label: 'DM Sans', family: 'DM Sans, sans-serif' },
  { value: 'work-sans', label: 'Work Sans', family: 'Work Sans, sans-serif' },
  { value: 'open-sans', label: 'Open Sans', family: 'Open Sans, sans-serif' },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'lato', label: 'Lato', family: 'Lato, sans-serif' },
  { value: 'raleway', label: 'Raleway', family: 'Raleway, sans-serif' },
  { value: 'outfit', label: 'Outfit', family: 'Outfit, sans-serif' },
  { value: 'manrope', label: 'Manrope', family: 'Manrope, sans-serif' },
  { value: 'space-grotesk', label: 'Space Grotesk', family: 'Space Grotesk, sans-serif' },
  { value: 'sora', label: 'Sora', family: 'Sora, sans-serif' },
  { value: 'lexend', label: 'Lexend', family: 'Lexend, sans-serif' }
]

export const fontSerifOptions: FontOption[] = [
  { value: 'anthropic-serif', label: 'Anthropic Serif', family: '"Anthropic Serif", Georgia, "Times New Roman", Times, serif' },
  { value: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  { value: 'lora', label: 'Lora', family: 'Lora, serif' },
  { value: 'merriweather', label: 'Merriweather', family: 'Merriweather, serif' },
  { value: 'playfair', label: 'Playfair Display', family: 'Playfair Display, serif' },
  { value: 'crimson', label: 'Crimson Text', family: 'Crimson Text, serif' },
  { value: 'courier-prime', label: 'Courier Prime', family: 'Courier Prime, monospace' },
  { value: 'times', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { value: 'eb-garamond', label: 'EB Garamond', family: 'EB Garamond, serif' },
  { value: 'libre-baskerville', label: 'Libre Baskerville', family: 'Libre Baskerville, serif' },
  { value: 'cormorant', label: 'Cormorant', family: 'Cormorant, serif' },
  { value: 'spectral', label: 'Spectral', family: 'Spectral, serif' },
  { value: 'bitter', label: 'Bitter', family: 'Bitter, serif' },
  { value: 'noto-serif', label: 'Noto Serif', family: 'Noto Serif, serif' }
]

export const fontMonoOptions: FontOption[] = [
  { value: 'monospace', label: 'Monospace', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
  { value: 'roboto-mono', label: 'Roboto Mono', family: 'Roboto Mono, monospace' },
  { value: 'fira-code', label: 'Fira Code', family: 'Fira Code, monospace' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono, monospace' },
  { value: 'source-code-pro', label: 'Source Code Pro', family: 'Source Code Pro, monospace' },
  { value: 'vt323', label: 'VT323', family: 'VT323, monospace' },
  { value: 'geist-mono', label: 'Geist Mono', family: 'Geist Mono, monospace' },
  { value: 'ibm-plex-mono', label: 'IBM Plex Mono', family: 'IBM Plex Mono, monospace' },
  { value: 'space-mono', label: 'Space Mono', family: 'Space Mono, monospace' },
  { value: 'inconsolata', label: 'Inconsolata', family: 'Inconsolata, monospace' },
  { value: 'courier-new', label: 'Courier New', family: '"Courier New", monospace' },
  { value: 'anonymous-pro', label: 'Anonymous Pro', family: 'Anonymous Pro, monospace' },
  { value: 'overpass-mono', label: 'Overpass Mono', family: 'Overpass Mono, monospace' }
]

// Style themes (from CSS files)
export const styleThemes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'default',
    label: 'Default',
    icon: 'lucide:palette',
    fonts: {
      sans: '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      serif: '"Anthropic Serif", Georgia, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    }
  },
  {
    id: 'claymorphism',
    name: 'claymorphism',
    label: 'Claymorphism',
    icon: 'lucide:flower-2',
    fonts: {
      sans: 'Plus Jakarta Sans, sans-serif',
      serif: 'Lora, serif',
      mono: 'Roboto Mono, monospace'
    }
  },
  {
    id: 'doom64',
    name: 'doom64',
    label: 'Doom 64',
    icon: 'lucide:gamepad-2',
    fonts: {
      sans: 'Orbitron, sans-serif',
      serif: 'Courier Prime, monospace',
      mono: 'VT323, monospace'
    }
  },
  {
    id: 'graphite',
    name: 'graphite',
    label: 'Graphite',
    icon: 'lucide:circle',
    fonts: {
      sans: 'Inter, sans-serif',
      serif: 'Playfair Display, serif',
      mono: 'JetBrains Mono, monospace'
    }
  },
  {
    id: 'mochamouse',
    name: 'mochamouse',
    label: 'Mocha Mouse',
    icon: 'lucide:coffee',
    fonts: {
      sans: 'Nunito, sans-serif',
      serif: 'Merriweather, serif',
      mono: 'Fira Code, monospace'
    }
  },
  {
    id: 'nature',
    name: 'nature',
    label: 'Nature',
    icon: 'lucide:leaf',
    fonts: {
      sans: 'Quicksand, sans-serif',
      serif: 'Crimson Text, serif',
      mono: 'Source Code Pro, monospace'
    }
  },
  {
    id: 'vercel',
    name: 'vercel',
    label: 'Vercel',
    icon: 'lucide:triangle',
    fonts: {
      sans: 'Geist, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Geist Mono, monospace'
    }
  }
]

export const radiusOptions: RadiusOption[] = [
  { value: '0', label: '0' },
  { value: '0.25', label: '0.25' },
  { value: '0.5', label: '0.5' },
  { value: '0.75', label: '0.75' },
  { value: '1', label: '1' },
  { value: '1.25', label: '1.25' },
  { value: '1.5', label: '1.5' },
  { value: '1.75', label: '1.75' },
  { value: '2', label: '2' }
]

export const cursorPalettes: CursorPalette[] = [
  {
    id: 'prism',
    label: 'Prism',
    swatch: 'linear-gradient(135deg, #00f5ff 0%, #8b5cf6 45%, #ff7a18 100%)',
    light: {
      core: 'rgba(255, 248, 241, 0.98)',
      glow: 'rgba(255, 132, 66, 0.18)',
      ring: 'rgba(255, 120, 36, 0.52)',
      mainTrail: ['rgba(255, 112, 32, 0.0)', 'rgba(255, 120, 36, 0.42)', 'rgba(255, 196, 120, 0.95)'],
      sideTrailA: ['rgba(88, 176, 255, 0.0)', 'rgba(88, 176, 255, 0.28)', 'rgba(171, 222, 255, 0.92)'],
      sideTrailB: ['rgba(190, 92, 255, 0.0)', 'rgba(190, 92, 255, 0.22)', 'rgba(233, 192, 255, 0.9)'],
    },
    dark: {
      core: 'rgba(242, 255, 254, 0.98)',
      glow: 'rgba(0, 255, 224, 0.28)',
      ring: 'rgba(0, 255, 224, 0.68)',
      mainTrail: ['rgba(0, 255, 224, 0.0)', 'rgba(0, 255, 224, 0.34)', 'rgba(134, 255, 240, 0.95)'],
      sideTrailA: ['rgba(99, 102, 241, 0.0)', 'rgba(99, 102, 241, 0.26)', 'rgba(183, 191, 255, 0.9)'],
      sideTrailB: ['rgba(255, 0, 153, 0.0)', 'rgba(255, 0, 153, 0.24)', 'rgba(255, 169, 223, 0.88)'],
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    swatch: 'linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #6366f1 100%)',
    light: {
      core: 'rgba(244, 255, 252, 0.98)',
      glow: 'rgba(34, 211, 238, 0.18)',
      ring: 'rgba(16, 185, 129, 0.48)',
      mainTrail: ['rgba(16, 185, 129, 0.0)', 'rgba(16, 185, 129, 0.34)', 'rgba(167, 243, 208, 0.94)'],
      sideTrailA: ['rgba(34, 211, 238, 0.0)', 'rgba(34, 211, 238, 0.26)', 'rgba(187, 247, 255, 0.9)'],
      sideTrailB: ['rgba(99, 102, 241, 0.0)', 'rgba(99, 102, 241, 0.18)', 'rgba(199, 210, 254, 0.86)'],
    },
    dark: {
      core: 'rgba(233, 255, 250, 0.98)',
      glow: 'rgba(16, 185, 129, 0.28)',
      ring: 'rgba(52, 211, 153, 0.66)',
      mainTrail: ['rgba(16, 185, 129, 0.0)', 'rgba(16, 185, 129, 0.34)', 'rgba(110, 255, 203, 0.95)'],
      sideTrailA: ['rgba(34, 211, 238, 0.0)', 'rgba(34, 211, 238, 0.3)', 'rgba(152, 247, 255, 0.92)'],
      sideTrailB: ['rgba(129, 140, 248, 0.0)', 'rgba(129, 140, 248, 0.22)', 'rgba(209, 213, 255, 0.86)'],
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    swatch: 'linear-gradient(135deg, #fb7185 0%, #f97316 55%, #facc15 100%)',
    light: {
      core: 'rgba(255, 247, 240, 0.98)',
      glow: 'rgba(249, 115, 22, 0.2)',
      ring: 'rgba(244, 114, 32, 0.52)',
      mainTrail: ['rgba(249, 115, 22, 0.0)', 'rgba(249, 115, 22, 0.36)', 'rgba(255, 210, 132, 0.95)'],
      sideTrailA: ['rgba(251, 113, 133, 0.0)', 'rgba(251, 113, 133, 0.24)', 'rgba(255, 205, 216, 0.9)'],
      sideTrailB: ['rgba(250, 204, 21, 0.0)', 'rgba(250, 204, 21, 0.22)', 'rgba(255, 243, 171, 0.86)'],
    },
    dark: {
      core: 'rgba(255, 247, 238, 0.98)',
      glow: 'rgba(249, 115, 22, 0.3)',
      ring: 'rgba(251, 146, 60, 0.68)',
      mainTrail: ['rgba(249, 115, 22, 0.0)', 'rgba(249, 115, 22, 0.36)', 'rgba(255, 202, 115, 0.95)'],
      sideTrailA: ['rgba(251, 113, 133, 0.0)', 'rgba(251, 113, 133, 0.22)', 'rgba(255, 183, 197, 0.88)'],
      sideTrailB: ['rgba(250, 204, 21, 0.0)', 'rgba(250, 204, 21, 0.22)', 'rgba(255, 241, 153, 0.84)'],
    },
  },
  {
    id: 'matrix',
    label: 'Matrix',
    swatch: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
    light: {
      core: 'rgba(240, 255, 245, 0.98)',
      glow: 'rgba(34, 197, 94, 0.16)',
      ring: 'rgba(34, 197, 94, 0.48)',
      mainTrail: ['rgba(34, 197, 94, 0.0)', 'rgba(34, 197, 94, 0.32)', 'rgba(187, 247, 208, 0.94)'],
      sideTrailA: ['rgba(20, 184, 166, 0.0)', 'rgba(20, 184, 166, 0.22)', 'rgba(176, 255, 246, 0.88)'],
      sideTrailB: ['rgba(132, 204, 22, 0.0)', 'rgba(132, 204, 22, 0.18)', 'rgba(231, 255, 181, 0.84)'],
    },
    dark: {
      core: 'rgba(239, 255, 244, 0.98)',
      glow: 'rgba(34, 197, 94, 0.28)',
      ring: 'rgba(74, 222, 128, 0.66)',
      mainTrail: ['rgba(34, 197, 94, 0.0)', 'rgba(34, 197, 94, 0.34)', 'rgba(136, 255, 182, 0.94)'],
      sideTrailA: ['rgba(20, 184, 166, 0.0)', 'rgba(20, 184, 166, 0.24)', 'rgba(126, 255, 240, 0.88)'],
      sideTrailB: ['rgba(132, 204, 22, 0.0)', 'rgba(132, 204, 22, 0.2)', 'rgba(217, 255, 137, 0.82)'],
    },
  },
]

export const accentPresets: AccentPreset[] = [
  {
    id: 'zinc',
    label: 'Zinc',
    swatch: '#3f3f46',
    light: {
      primary: 'oklch(0.274 0.006 286.033)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.552 0.016 285.938)',
      chart1: 'oklch(0.556 0.016 285.938)',
      chart2: 'oklch(0.705 0.015 286.067)',
      chart3: 'oklch(0.442 0.017 285.786)',
      chart4: 'oklch(0.646 0.015 286.03)',
      chart5: 'oklch(0.37 0.013 285.805)',
      sidebarPrimary: 'oklch(0.274 0.006 286.033)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarRing: 'oklch(0.552 0.016 285.938)',
      selection: 'oklch(0.274 0.006 286.033)',
      selectionForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.92 0.004 286.32)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.705 0.015 286.067)',
      chart1: 'oklch(0.705 0.015 286.067)',
      chart2: 'oklch(0.646 0.015 286.03)',
      chart3: 'oklch(0.796 0.012 286.067)',
      chart4: 'oklch(0.552 0.016 285.938)',
      chart5: 'oklch(0.87 0.004 286.32)',
      sidebarPrimary: 'oklch(0.92 0.004 286.32)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)',
      sidebarRing: 'oklch(0.705 0.015 286.067)',
      selection: 'oklch(0.92 0.004 286.32)',
      selectionForeground: 'oklch(0.205 0 0)',
    },
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#2563eb',
    light: {
      primary: 'oklch(0.623 0.214 259.815)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.623 0.214 259.815)',
      chart1: 'oklch(0.623 0.214 259.815)',
      chart2: 'oklch(0.707 0.165 254.624)',
      chart3: 'oklch(0.546 0.215 262.881)',
      chart4: 'oklch(0.488 0.243 264.376)',
      chart5: 'oklch(0.424 0.199 265.638)',
      sidebarPrimary: 'oklch(0.623 0.214 259.815)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarRing: 'oklch(0.623 0.214 259.815)',
      selection: 'oklch(0.623 0.214 259.815)',
      selectionForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.707 0.165 254.624)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.707 0.165 254.624)',
      chart1: 'oklch(0.707 0.165 254.624)',
      chart2: 'oklch(0.623 0.214 259.815)',
      chart3: 'oklch(0.769 0.122 254.387)',
      chart4: 'oklch(0.546 0.215 262.881)',
      chart5: 'oklch(0.83 0.09 254.09)',
      sidebarPrimary: 'oklch(0.707 0.165 254.624)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)',
      sidebarRing: 'oklch(0.707 0.165 254.624)',
      selection: 'oklch(0.707 0.165 254.624)',
      selectionForeground: 'oklch(0.205 0 0)',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#10b981',
    light: {
      primary: 'oklch(0.627 0.194 149.214)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.627 0.194 149.214)',
      chart1: 'oklch(0.627 0.194 149.214)',
      chart2: 'oklch(0.723 0.169 149.579)',
      chart3: 'oklch(0.527 0.154 150.069)',
      chart4: 'oklch(0.448 0.119 151.328)',
      chart5: 'oklch(0.84 0.124 150.933)',
      sidebarPrimary: 'oklch(0.627 0.194 149.214)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarRing: 'oklch(0.627 0.194 149.214)',
      selection: 'oklch(0.627 0.194 149.214)',
      selectionForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.723 0.169 149.579)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.723 0.169 149.579)',
      chart1: 'oklch(0.723 0.169 149.579)',
      chart2: 'oklch(0.627 0.194 149.214)',
      chart3: 'oklch(0.84 0.124 150.933)',
      chart4: 'oklch(0.527 0.154 150.069)',
      chart5: 'oklch(0.896 0.075 151.605)',
      sidebarPrimary: 'oklch(0.723 0.169 149.579)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)',
      sidebarRing: 'oklch(0.723 0.169 149.579)',
      selection: 'oklch(0.723 0.169 149.579)',
      selectionForeground: 'oklch(0.205 0 0)',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#7c3aed',
    light: {
      primary: 'oklch(0.606 0.25 292.717)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.606 0.25 292.717)',
      chart1: 'oklch(0.606 0.25 292.717)',
      chart2: 'oklch(0.714 0.203 305.504)',
      chart3: 'oklch(0.541 0.281 293.009)',
      chart4: 'oklch(0.491 0.27 292.581)',
      chart5: 'oklch(0.87 0.065 305.504)',
      sidebarPrimary: 'oklch(0.606 0.25 292.717)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
      sidebarRing: 'oklch(0.606 0.25 292.717)',
      selection: 'oklch(0.606 0.25 292.717)',
      selectionForeground: 'oklch(0.985 0 0)',
    },
    dark: {
      primary: 'oklch(0.714 0.203 305.504)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.714 0.203 305.504)',
      chart1: 'oklch(0.714 0.203 305.504)',
      chart2: 'oklch(0.606 0.25 292.717)',
      chart3: 'oklch(0.806 0.112 301.166)',
      chart4: 'oklch(0.541 0.281 293.009)',
      chart5: 'oklch(0.913 0.055 306.111)',
      sidebarPrimary: 'oklch(0.714 0.203 305.504)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)',
      sidebarRing: 'oklch(0.714 0.203 305.504)',
      selection: 'oklch(0.714 0.203 305.504)',
      selectionForeground: 'oklch(0.205 0 0)',
    },
  },
]

// For backward compatibility
export const themes = styleThemes
