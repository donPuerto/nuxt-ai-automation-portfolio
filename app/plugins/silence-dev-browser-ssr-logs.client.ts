const isNoisyDevSsrLog = (args: unknown[]) => {
  const [firstArg] = args

  return typeof firstArg === 'string'
    && firstArg.startsWith('ssr:success Vite server hmr')
}

export default defineNuxtPlugin(() => {
  if (!import.meta.dev) {
    return
  }

  const originalLog = window.console.log.bind(window.console)
  const originalInfo = window.console.info.bind(window.console)

  window.console.log = (...args: unknown[]) => {
    if (isNoisyDevSsrLog(args)) {
      return
    }

    originalLog(...args)
  }

  window.console.info = (...args: unknown[]) => {
    if (isNoisyDevSsrLog(args)) {
      return
    }

    originalInfo(...args)
  }
})
