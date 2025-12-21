export const useLayoutManager = () => {
  const isLayoutFixed = useState('is-layout-fixed', () => {
    if (import.meta.client) {
      return localStorage.getItem('layout-mode') === 'fixed'
    }
    return false
  })

  const toggleLayout = () => {
    if (import.meta.client) {
      const html = document.documentElement
      const newMode = !isLayoutFixed.value

      if (newMode) {
        html.classList.add('layout-fixed')
        localStorage.setItem('layout-mode', 'fixed')
      } else {
        html.classList.remove('layout-fixed')
        localStorage.setItem('layout-mode', 'full')
      }

      isLayoutFixed.value = newMode
    }
  }

  // Auto-init layout on client
  if (import.meta.client) {
    const savedMode = localStorage.getItem('layout-mode')
    const html = document.documentElement
    
    if (savedMode === 'fixed') {
      html.classList.add('layout-fixed')
      isLayoutFixed.value = true
    }
  }

  return {
    isLayoutFixed,
    toggleLayout
  }
}
