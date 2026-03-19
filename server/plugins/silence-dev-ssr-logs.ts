export default defineNitroPlugin((nitroApp) => {
  if (!import.meta.dev) {
    return
  }

  nitroApp.hooks.hook('dev:ssr-logs', (ctx) => {
    ctx.logs.length = 0
  })
})
