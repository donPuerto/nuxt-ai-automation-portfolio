// System Prompt: This project uses Nuxt 4, Tailwind CSS 4, Inspira UI, and shadcn/ui.
// Always use <script setup> by default in Vue components.
// For setup instructions, see .cursorrules or README.md.

// Theme composable for managing light/dark mode
export const useTheme = () => {
  const isDark = ref(false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    // In a real implementation, you'd update the document class or use a theme provider
    // For now, this is a placeholder
  }

  // Initialize theme from localStorage or system preference
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  })

  // Watch for changes and save to localStorage
  watch(isDark, (newValue) => {
    localStorage.setItem('theme', newValue ? 'dark' : 'light')
    // Apply theme to document/body if needed
  })

  return {
    isDark: readonly(isDark),
    toggleTheme
  }
}