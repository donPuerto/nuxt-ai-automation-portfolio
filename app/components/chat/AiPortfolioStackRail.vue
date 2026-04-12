<script setup lang="ts">
type StackCard = {
  id: string
  label: string
  category: string
  description: string
  details: string[]
  url: string
  icon: string
  iconClass: string
}

const props = defineProps<{
  items: string[]
}>()

const stackDefinitions = [
  {
    id: 'n8n',
    label: 'n8n',
    category: 'Orchestration',
    matcher: ['n8n'],
    url: 'https://n8n.io/',
    icon: 'simple-icons:n8n',
    iconClass: 'text-[#f06a1f]',
    details: [
      'Production-grade workflow orchestration with webhook-first architecture.',
      'Best fit for multi-step business processes, queueing, routing, and AI tool chains.',
    ],
  },
  {
    id: 'make',
    label: 'Make',
    category: 'Scenario design',
    matcher: ['make.com', 'make'],
    url: 'https://www.make.com/',
    icon: 'simple-icons:make',
    iconClass: 'text-[#6d5efc]',
    details: [
      'Fast scenario prototyping for operations teams and cross-app workflows.',
      'Useful when a flow needs to be flexible and visual before it becomes a hardened system.',
    ],
  },
  {
    id: 'zapier',
    label: 'Zapier',
    category: 'Integrations',
    matcher: ['zapier'],
    url: 'https://zapier.com/',
    icon: 'simple-icons:zapier',
    iconClass: 'text-[#ff5a1f]',
    details: [
      'Quick app-to-app glue for lightweight automations and fast launches.',
      'Great when the goal is speed and maintainability over deep orchestration.',
    ],
  },
  {
    id: 'ghl',
    label: 'GoHighLevel',
    category: 'CRM automation',
    matcher: ['gohighlevel', 'highlevel'],
    url: 'https://www.gohighlevel.com/',
    icon: 'lucide:badge-dollar-sign',
    iconClass: 'text-[#4ecdc4]',
    details: [
      'Pipeline automation, follow-up sequences, and booking-driven CRM flows.',
      'Useful for lead reactivation, nurture systems, and sales operations handoff.',
    ],
  },
  {
    id: 'claude',
    label: 'Claude',
    category: 'AI agents',
    matcher: ['claude'],
    url: 'https://www.anthropic.com/claude',
    icon: 'simple-icons:anthropic',
    iconClass: 'text-[#d97757]',
    details: [
      'Reasoning layer for internal copilots, SOP assistants, and structured AI replies.',
      'Strong fit for calm, instruction-heavy AI experiences that need reliable tone and tool use.',
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    category: 'Model routing',
    matcher: ['openrouter'],
    url: 'https://openrouter.ai/',
    icon: 'lucide:orbit',
    iconClass: 'text-[#8ba4ff]',
    details: [
      'Model routing layer for switching between providers without rewriting the app.',
      'Useful for balancing speed, cost, and availability across multiple AI backends.',
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    category: 'Reasoning layer',
    matcher: ['openai'],
    url: 'https://openai.com/',
    icon: 'simple-icons:openai',
    iconClass: 'text-[#f4f4f2]',
    details: [
      'General-purpose reasoning and generation for AI product flows and assistants.',
      'Useful when a workflow needs flexible output shaping, summarization, or tool orchestration.',
    ],
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    category: 'API bridges',
    matcher: ['webhook', 'api'],
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
    icon: 'lucide:webhook',
    iconClass: 'text-[#e0b36a]',
    details: [
      'Bridges apps, APIs, and automation platforms with explicit request-response contracts.',
      'The backbone for syncing systems cleanly without fragile manual handoffs.',
    ],
  },
] as const

const expandedCardKey = ref<string | null>(null)

const stackCards = computed<StackCard[]>(() => {
  const normalizedItems = props.items.map(item => item.toLowerCase())

  const cards = stackDefinitions
    .filter(definition => normalizedItems.some(item =>
      definition.matcher.some(matcher => item.includes(matcher)),
    ))
    .map((definition) => {
      const matchedDescription = props.items.find(item =>
        definition.matcher.some(matcher => item.toLowerCase().includes(matcher)),
      ) ?? definition.category

      return {
        id: definition.id,
        label: definition.label,
        category: definition.category,
        description: matchedDescription,
        details: [...definition.details],
        url: definition.url,
        icon: definition.icon,
        iconClass: definition.iconClass,
      }
    })

  if (cards.length) {
    return cards
  }

  return props.items.map((item, index) => ({
    id: `fallback-${index}`,
    label: item.split(' ')[0] ?? `Stack ${index + 1}`,
    category: 'Workflow stack',
    description: item,
    details: [item],
    url: '#',
    icon: 'lucide:layers-3',
    iconClass: 'text-primary/85',
  }))
})

const duplicatedCards = computed(() => [...stackCards.value, ...stackCards.value])

const toggleCard = (cardKey: string) => {
  expandedCardKey.value = expandedCardKey.value === cardKey ? null : cardKey
}

</script>

<template>
  <div class="stack-rail-shell overflow-hidden">
    <div class="stack-rail-track flex w-max gap-4 py-1">
      <article
        v-for="(card, index) in duplicatedCards"
        :key="`${card.id}-${index}`"
        class="flex min-h-[12rem] w-[15rem] shrink-0 flex-col justify-between rounded-[1.2rem] border border-border/60 bg-background/78 p-4 text-left shadow-[0_18px_34px_-28px_rgba(0,0,0,0.55)] backdrop-blur-sm transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div class="flex h-full flex-col justify-between">
          <a
            :href="card.url"
            target="_blank"
            rel="noreferrer"
            class="block rounded-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-primary/75">
                  {{ card.category }}
                </p>
                <h3 class="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground/95">
                  {{ card.label }}
                </h3>
              </div>

              <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/25">
                <Icon :name="card.icon" class="size-5.5" :class="card.iconClass" />
              </div>
            </div>

            <p class="mt-5 line-clamp-3 text-sm leading-6 text-foreground/70">
              {{ card.description }}
            </p>
          </a>

          <div
            v-if="expandedCardKey === `${card.id}-${index}`"
            class="mt-4 space-y-2 border-t border-border/50 pt-3"
          >
            <p
              v-for="detail in card.details"
              :key="detail"
              class="text-[0.82rem] leading-6 text-foreground/68"
            >
              {{ detail }}
            </p>
          </div>

          <button
            type="button"
            class="mt-4 self-start text-[0.68rem] font-medium uppercase tracking-[0.16em] text-primary/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            @click.stop="toggleCard(`${card.id}-${index}`)"
          >
            {{ expandedCardKey === `${card.id}-${index}` ? 'Click to collapse' : 'Click to expand' }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.stack-rail-track {
  animation: stack-rail-scroll 120s linear infinite;
  will-change: transform;
}

.stack-rail-shell:hover .stack-rail-track {
  animation-play-state: paused;
}

@keyframes stack-rail-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
