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
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\'',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
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
