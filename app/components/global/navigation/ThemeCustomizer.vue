<template>
  <div class="min-w-[320px]">
    <!-- Header with Title and Theme Toggle - Sticky -->
    <div class="sticky top-0 z-10 bg-background border-b px-4 py-2 flex items-center justify-between">
      <h2 class="text-sm font-bold tracking-wide uppercase">Theme Customizer</h2>
      <Button
        variant="ghost"
        size="icon"
        @click="(e) => toggleTheme(e)"
        class="h-9 w-9 rounded-md"
      >
        <Icon name="lucide:sun" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Icon name="lucide:moon" class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </div>

    <!-- Content with reduced padding -->
    <div class="space-y-3 p-4">

    <!-- Layout Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Layout</h3>
      <div class="flex gap-2">
        <Button
          :variant="!isLayoutFixed ? 'default' : 'outline'"
          @click="toggleLayout"
          class="flex-1"
        >
          <Icon name="lucide:maximize-2" class="w-4 h-4" />
          <span>Full Width</span>
        </Button>
        <Button
          :variant="isLayoutFixed ? 'default' : 'outline'"
          @click="toggleLayout"
          class="flex-1"
        >
          <Icon name="lucide:minimize-2" class="w-4 h-4" />
          <span>Fixed</span>
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Themes Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Themes</h3>
      <Select v-model="currentTheme" @update:model-value="(value) => value && loadTheme(value as string)">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Select a theme">
            {{ selectedTheme?.label }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="theme in styleThemes"
              :key="theme.id"
              :value="theme.id"
            >
              <div class="flex items-center gap-2">
                <Icon :name="theme.icon" class="w-4 h-4" />
                {{ theme.label }}
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <!-- Customization Tabs -->
    <Tabs default-value="colors" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="typography">Typography</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>

      <!-- Colors Tab -->
      <TabsContent value="colors" class="space-y-3 mt-4">
        <div class="space-y-2">
          <!-- Primary Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Primary Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Primary</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#818cf8" @input="(e) => handleColorChange('primary', e)" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#818cf8" @input="(e) => handleColorChange('primary', e)" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Primary Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" @input="(e) => handleColorChange('primary-foreground', e)" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" @input="(e) => handleColorChange('primary-foreground', e)" />
                </div>
              </div>
            </div>
          </details>

          <!-- Secondary Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Secondary Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Secondary</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#3a3633" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#3a3633" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Secondary Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#d1d5db" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#d1d5db" />
                </div>
              </div>
            </div>
          </details>

          <!-- Accent Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Accent Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Accent</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#484441" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#484441" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Accent Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#d1d5db" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#d1d5db" />
                </div>
              </div>
            </div>
          </details>

          <!-- Base Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Base Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Background</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#e2e8f0" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#e2e8f0" />
                </div>
              </div>
            </div>
          </details>

          <!-- Card Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Card Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Card</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Card Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#e2e8f0" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#e2e8f0" />
                </div>
              </div>
            </div>
          </details>

          <!-- Popover Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Popover Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Popover</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Popover Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#e2e8f0" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#e2e8f0" />
                </div>
              </div>
            </div>
          </details>

          <!-- Muted Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Muted Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Muted</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#3a3633" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#3a3633" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Muted Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#94a3b8" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#94a3b8" />
                </div>
              </div>
            </div>
          </details>

          <!-- Destructive Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Destructive Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Destructive</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#ef4444" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#ef4444" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Destructive Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#f8fafc" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#f8fafc" />
                </div>
              </div>
            </div>
          </details>

          <!-- Border & Input Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Border & Input Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Border</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#3a3633" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#3a3633" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Input</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#3a3633" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#3a3633" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Ring</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#818cf8" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#818cf8" />
                </div>
              </div>
            </div>
          </details>

          <!-- Chart Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Chart Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Chart 1</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#818cf8" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#818cf8" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Chart 2</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#34d399" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#34d399" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Chart 3</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#fbbf24" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#fbbf24" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Chart 4</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#f87171" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#f87171" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Chart 5</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#a78bfa" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#a78bfa" />
                </div>
              </div>
            </div>
          </details>

          <!-- Sidebar Colors -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Sidebar Colors</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-3 p-3 border rounded-md mt-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Background</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#e2e8f0" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#e2e8f0" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Primary</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#818cf8" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#818cf8" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Primary Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1e1b18" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1e1b18" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Accent</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#484441" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#484441" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Accent Foreground</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#d1d5db" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#d1d5db" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Border</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#3a3633" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#3a3633" />
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Sidebar Ring</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#818cf8" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#818cf8" />
                </div>
              </div>
            </div>
          </details>
        </div>
      </TabsContent>

      <!-- Typography Tab -->
      <TabsContent value="typography" class="space-y-4 mt-4">
        <div class="space-y-4">
          <!-- Font Family -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium">Font Family</h4>
            
            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">Sans-Serif Font</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Plus Jakarta Sans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plus-jakarta">Plus Jakarta Sans</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="system">System UI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">Serif Font</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Lora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lora">Lora</SelectItem>
                  <SelectItem value="merriweather">Merriweather</SelectItem>
                  <SelectItem value="playfair">Playfair Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <label class="text-xs text-muted-foreground">Monospace Font</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Roboto Mono" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roboto-mono">Roboto Mono</SelectItem>
                  <SelectItem value="fira-code">Fira Code</SelectItem>
                  <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <!-- Letter Spacing -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Letter Spacing</label>
              <span class="text-xs text-muted-foreground">0 em</span>
            </div>
            <input type="range" min="-0.1" max="0.2" step="0.01" value="0" class="w-full" />
          </div>
        </div>
      </TabsContent>

      <!-- Other Tab -->
      <TabsContent value="other" class="space-y-4 mt-4">
        <div class="space-y-4">
          <!-- Radius -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Radius</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="p-3 border rounded-md mt-2">
              <div class="flex gap-2">
                <Button
                  v-for="radius in radiusOptions"
                  :key="radius.value"
                  :variant="currentRadius === radius.value ? 'default' : 'outline'"
                  @click="loadRadius(radius.value)"
                  class="flex-1"
                >
                  {{ radius.label }}
                </Button>
              </div>
            </div>
          </details>

          <!-- Shadow -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">Shadow</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-4 p-3 border rounded-md mt-2">
              <!-- Shadow Color -->
              <div class="space-y-2">
                <label class="text-xs text-muted-foreground">Shadow Color</label>
                <div class="flex items-center gap-2">
                  <input type="color" class="h-8 w-12 rounded border cursor-pointer" value="#1a1a1a" />
                  <input type="text" class="flex-1 h-8 px-3 text-sm rounded-md border bg-background" value="#1a1a1a" />
                </div>
              </div>

              <!-- Shadow Opacity -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Shadow Opacity</label>
                  <span class="text-xs">0.18</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value="0.18" class="w-full" />
              </div>

              <!-- Blur Radius -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Blur Radius</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">10</span>
                    <span class="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <input type="range" min="0" max="50" step="1" value="10" class="w-full" />
              </div>

              <!-- Spread -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Spread</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">4</span>
                    <span class="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <input type="range" min="0" max="50" step="1" value="4" class="w-full" />
              </div>

              <!-- Offset X -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Offset X</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">2</span>
                    <span class="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <input type="range" min="-50" max="50" step="1" value="2" class="w-full" />
              </div>

              <!-- Offset Y -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Offset Y</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">2</span>
                    <span class="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <input type="range" min="-50" max="50" step="1" value="2" class="w-full" />
              </div>
            </div>
          </details>

          <!-- HSL Adjustments -->
          <details class="group">
            <summary class="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-md hover:bg-muted">
              <span class="text-sm font-medium">HSL Adjustments</span>
              <Icon name="lucide:chevron-down" class="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div class="space-y-4 p-3 border rounded-md mt-2">
              <!-- Color Presets -->
              <div class="flex gap-2 flex-wrap">
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)"></button>
                <button class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"></button>
              </div>

              <Button variant="ghost" size="sm" class="w-full">
                <Icon name="lucide:chevron-down" class="w-4 h-4 mr-2" />
                Show more presets
              </Button>

              <!-- Hue Shift -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Hue Shift</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">120</span>
                    <span class="text-xs text-muted-foreground">deg</span>
                  </div>
                </div>
                <input type="range" min="0" max="360" step="1" value="120" class="w-full" />
              </div>

              <!-- Saturation Multiplier -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Saturation Multiplier</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">0.65</span>
                    <span class="text-xs text-muted-foreground">x</span>
                  </div>
                </div>
                <input type="range" min="0" max="2" step="0.05" value="0.65" class="w-full" />
              </div>

              <!-- Lightness Multiplier -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs text-muted-foreground">Lightness Multiplier</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs">1</span>
                    <span class="text-xs text-muted-foreground">x</span>
                  </div>
                </div>
                <input type="range" min="0" max="2" step="0.05" value="1" class="w-full" />
              </div>
            </div>
          </details>
        </div>
      </TabsContent>
    </Tabs>

    </div>
  </div>
</template>

<script setup lang="ts">
import { styleThemes, radiusOptions } from '@@/shared'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { currentTheme, currentRadius, loadTheme, loadRadius } = useThemeManager()
const colorMode = useColorMode()
const { isLayoutFixed, toggleLayout } = useLayoutManager()
const { isDark, toggleTheme } = useTheme()

const selectedTheme = computed(() => 
  styleThemes.find(t => t.id === currentTheme.value)
)

// Handle color changes
const updateCSSVariable = (variable: string, value: string) => {
  if (import.meta.client) {
    const style = document.getElementById('custom-color-overrides') as HTMLStyleElement
    let styleElement: HTMLStyleElement
    
    if (!style) {
      styleElement = document.createElement('style')
      styleElement.id = 'custom-color-overrides'
      document.head.appendChild(styleElement)
    } else {
      styleElement = style
    }

    // Get existing rules or create new
    const sheet = styleElement.sheet as CSSStyleSheet
    const rules = Array.from(sheet.cssRules)
    const targetSelector = '.theme-container, [data-reka-popper-content-wrapper]'
    
    let ruleIndex = rules.findIndex(rule => {
      if (rule instanceof CSSStyleRule) {
        return rule.selectorText === targetSelector
      }
      return false
    })

    if (ruleIndex === -1) {
      sheet.insertRule(`${targetSelector} { --${variable}: ${value} !important; }`, 0)
    } else {
      const rule = rules[ruleIndex] as CSSStyleRule
      rule.style.setProperty(`--${variable}`, value, 'important')
    }
  }
}

const handleColorChange = (variable: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Update CSS
  updateCSSVariable(variable, value)
  
  // Save to sessionStorage
  if (import.meta.client) {
    const customColors = JSON.parse(sessionStorage.getItem('custom-colors') || '{}')
    customColors[variable] = value
    sessionStorage.setItem('custom-colors', JSON.stringify(customColors))
  }
}

// Load custom colors on mount
if (import.meta.client) {
  onMounted(() => {
    const customColors = JSON.parse(sessionStorage.getItem('custom-colors') || '{}')
    Object.entries(customColors).forEach(([variable, value]) => {
      updateCSSVariable(variable, value as string)
    })
  })
}
</script>
