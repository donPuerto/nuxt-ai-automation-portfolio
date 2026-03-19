<template>
  <header 
    class="sticky top-0 z-50 transition-all duration-300 border-b"
    :class="[
      isScrolled 
        ? 'bg-background/40 backdrop-blur-lg border-border/40 shadow-md' 
        : 'bg-transparent border-transparent'
    ]"
  >
    <nav class="mx-auto w-full flex items-center justify-between p-4 fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <NuxtLink to="/">
        <Logo :logo-only="false" />
      </NuxtLink>

      <!-- Desktop Menu -->
      <NavigationMenu class="hidden md:flex">
        <NavigationMenuList>
          <NavigationMenuItem v-for="route in routes" :key="route.path">
            <NavigationMenuLink as-child>
              <NuxtLink :to="route.path" class="hover:text-primary transition-colors text-base lg:text-lg font-medium">
                {{ route.name }}
              </NuxtLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <!-- Theme Selector & Book a Call -->
      <div class="flex items-center gap-2">
        <ThemeSelector />
        <DiscoveryCallButton
          label="Start a discovery call"
          variant="default"
          size="default"
          button-class="hidden rounded-full md:inline-flex"
        />
      </div>

      
     
    </nav>

    <!-- Mobile Menu -->
    <div v-if="isOpen" class="md:hidden bg-background/20 backdrop-blur-md border-t mx-auto w-full fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <ul class="flex flex-col space-y-4 p-4">
        <li v-for="route in routes" :key="route.path">
          <NuxtLink :to="route.path" class="block hover:text-primary text-lg font-medium" @click="isOpen = false">
            {{ route.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup lang="ts">
import { routes } from '@@/shared'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu'

// Scroll detection
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const isOpen = ref(false)
</script>
