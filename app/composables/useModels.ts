export interface ChatModelOption {
  id: string
  label: string
  description: string
  available: boolean
}

const MODEL_OPTIONS: ChatModelOption[] = [
  {
    id: 'local-portfolio-agent',
    label: 'Local portfolio agent',
    description: 'Current knowledge source for this portfolio.',
    available: true,
  },
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet',
    description: 'Coming soon.',
    available: false,
  },
]

export function useModels() {
  const model = useState<string>('chat-model', () => MODEL_OPTIONS[0]?.id || '')
  return {
    models: MODEL_OPTIONS,
    model,
  }
}
