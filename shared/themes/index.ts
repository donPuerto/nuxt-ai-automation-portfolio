export interface ThemeConfig {
  id: string
  name: string
  icon: string
}

export const themes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    icon: 'lucide:palette'
  },
  {
    id: 'claymorphism',
    name: 'Claymorphism',
    icon: 'lucide:flower-2'
  },
  {
    id: 'doom64',
    name: 'Doom 64',
    icon: 'lucide:gamepad-2'
  },
  {
    id: 'graphite',
    name: 'Graphite',
    icon: 'lucide:circle'
  },
  {
    id: 'mochamouse',
    name: 'Mocha Mouse',
    icon: 'lucide:coffee'
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: 'lucide:leaf'
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: 'lucide:triangle'
  }
]
