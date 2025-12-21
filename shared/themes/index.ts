export interface ThemeConfig {
  id: string
  name: string
  label: string
  icon: string
}

export interface ColorTheme {
  id: string
  name: string
  label: string
}

export interface RadiusOption {
  value: string
  label: string
}

// Style themes (from CSS files)
export const styleThemes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'default',
    label: 'Default',
    icon: 'lucide:palette'
  },
  {
    id: 'claymorphism',
    name: 'claymorphism',
    label: 'Claymorphism',
    icon: 'lucide:flower-2'
  },
  {
    id: 'doom64',
    name: 'doom64',
    label: 'Doom 64',
    icon: 'lucide:gamepad-2'
  },
  {
    id: 'graphite',
    name: 'graphite',
    label: 'Graphite',
    icon: 'lucide:circle'
  },
  {
    id: 'mochamouse',
    name: 'mochamouse',
    label: 'Mocha Mouse',
    icon: 'lucide:coffee'
  },
  {
    id: 'nature',
    name: 'nature',
    label: 'Nature',
    icon: 'lucide:leaf'
  },
  {
    id: 'vercel',
    name: 'vercel',
    label: 'Vercel',
    icon: 'lucide:triangle'
  }
]

// Color themes (from themes.css)
export const colorThemes: ColorTheme[] = [
  { id: 'zinc', name: 'zinc', label: 'Zinc' },
  { id: 'rose', name: 'rose', label: 'Rose' },
  { id: 'blue', name: 'blue', label: 'Blue' },
  { id: 'green', name: 'green', label: 'Green' },
  { id: 'orange', name: 'orange', label: 'Orange' },
  { id: 'red', name: 'red', label: 'Red' },
  { id: 'slate', name: 'slate', label: 'Slate' },
  { id: 'stone', name: 'stone', label: 'Stone' },
  { id: 'gray', name: 'gray', label: 'Gray' },
  { id: 'neutral', name: 'neutral', label: 'Neutral' },
  { id: 'yellow', name: 'yellow', label: 'Yellow' },
  { id: 'violet', name: 'violet', label: 'Violet' },
  { id: 'amber', name: 'amber', label: 'Amber' },
  { id: 'purple', name: 'purple', label: 'Purple' },
  { id: 'teal', name: 'teal', label: 'Teal' }
]

export const radiusOptions: RadiusOption[] = [
  { value: '0', label: '0' },
  { value: '0.25', label: '0.25' },
  { value: '0.5', label: '0.5' },
  { value: '0.75', label: '0.75' },
  { value: '1', label: '1' }
]

// For backward compatibility
export const themes = styleThemes
