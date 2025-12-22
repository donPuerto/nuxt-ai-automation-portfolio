export default defineNuxtPlugin({
  name: 'critical-css',
  enforce: 'pre',
  setup() {
    // Ensure styles are visible immediately
    if (import.meta.client) {
      // Remove any visibility: hidden that might have been set
      document.documentElement.style.visibility = 'visible'
      document.body.style.visibility = 'visible'
      
      // Clean up server-injected critical CSS after main CSS loads
      const cleanup = () => {
        const criticalCSS = document.getElementById('critical-css')
        if (criticalCSS && document.styleSheets.length > 1) {
          // Remove only after main styles are loaded
          setTimeout(() => criticalCSS.remove(), 100)
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanup)
      } else {
        cleanup()
      }
    }
  }
})
