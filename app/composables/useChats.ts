export interface UIChat {
  id: string
  label: string
  icon: string
  createdAt: string
}

export function useChats(chats: Ref<UIChat[] | undefined>) {
  const groups = computed(() => {
    const byMonth = new Map<string, UIChat[]>()

    for (const chat of chats.value ?? []) {
      const date = new Date(chat.createdAt)
      const key = Number.isNaN(date.getTime())
        ? 'Unknown'
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      if (!byMonth.has(key)) {
        byMonth.set(key, [])
      }
      byMonth.get(key)!.push(chat)
    }

    return Array.from(byMonth.entries()).map(([label, items]) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      items,
    }))
  })

  return { groups }
}
