const normalizeArgs = (args: unknown[]) =>
  args
    .map((arg) => {
      if (typeof arg === 'string') {
        return arg
      }

      if (typeof arg === 'number' || typeof arg === 'boolean') {
        return String(arg)
      }

      if (arg instanceof Error) {
        return `${arg.name} ${arg.message}`
      }

      if (arg && typeof arg === 'object') {
        try {
          return JSON.stringify(arg)
        }
        catch {
          return ''
        }
      }

      return ''
    })
    .join(' ')

const isNoisyDevLog = (args: unknown[]) => {
  const text = normalizeArgs(args)
  const lower = text.toLowerCase()

  return lower.includes('ssr [nitro-runtime]')
    || lower.includes('ssr [nuxt-app]')
    || lower.includes('ssr:success vite server hmr')
    || lower.includes('dev:ssr-logs')
    || lower.includes('page:loading:start')
    || lower.includes('app:created')
    || lower.includes('app:beforemount')
    || lower.includes('vue:setup')
    || lower.includes('app:mounted')
    || lower.includes('page:start')
    || lower.includes('page:finish')
    || lower.includes('page:loading:end')
    || lower.includes('app:suspense:resolve')
    || lower.includes('link:prefetch')
    || lower.includes('nuxt devtools')
    || lower.includes('<suspense> is an experimental feature')
    || (lower.includes('your project has pages') && lower.includes('nuxtpage') && lower.includes('has not been used'))
    || (lower.includes('timer') && lower.includes('[nuxt-app]') && lower.includes('already exists'))
}

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) {
    return
  }

  const originalLog = window.console.log.bind(window.console)
  const originalInfo = window.console.info.bind(window.console)
  const originalDebug = window.console.debug.bind(window.console)
  const originalWarn = window.console.warn.bind(window.console)
  const originalGroup = window.console.group.bind(window.console)
  const originalGroupCollapsed = window.console.groupCollapsed.bind(window.console)
  const originalTime = window.console.time.bind(window.console)
  const originalTimeEnd = window.console.timeEnd.bind(window.console)
  const originalTimeLog = window.console.timeLog.bind(window.console)

  const isNoisyTimerLabel = (label: unknown) =>
    typeof label === 'string' && (
      label.toLowerCase().includes('[nuxt-app]')
      || label.toLowerCase().includes('link:prefetch')
      || label.toLowerCase().includes('dev:ssr-logs')
    )

  window.console.log = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalLog(...args)
  }

  window.console.info = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalInfo(...args)
  }

  window.console.debug = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalDebug(...args)
  }

  window.console.warn = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalWarn(...args)
  }

  window.console.group = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalGroup(...args)
  }

  window.console.groupCollapsed = (...args: unknown[]) => {
    if (isNoisyDevLog(args)) {
      return
    }

    originalGroupCollapsed(...args)
  }

  window.console.time = (label?: string) => {
    if (isNoisyTimerLabel(label)) {
      return
    }

    originalTime(label)
  }

  window.console.timeEnd = (label?: string) => {
    if (isNoisyTimerLabel(label)) {
      return
    }

    originalTimeEnd(label)
  }

  window.console.timeLog = (label?: string, ...args: unknown[]) => {
    if (isNoisyTimerLabel(label)) {
      return
    }

    originalTimeLog(label, ...args)
  }
})
