<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

const props = withDefaults(defineProps<{
  open: boolean
  displayName?: string
  loading?: boolean
}>(), {
  displayName: 'there',
  loading: false,
})

const emit = defineEmits<{
  close: []
}>()

const handleOpenChange = (open: boolean) => {
  if (props.open && !open) {
    handleDismiss()
  }
}

const handleDismiss = () => {
  if (!props.loading) {
    emit('close')
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent
      class="overflow-hidden border-[#4a433d] bg-[#2b2724] p-0 text-[#f0deca] shadow-2xl sm:max-w-3xl"
      @escape-key-down.prevent
      @interact-outside.prevent
      @pointer-down-outside.prevent
    >
      <div class="grid md:grid-cols-[1.05fr_0.95fr]">
        <div class="px-6 py-7 md:px-8 md:py-8">
          <div class="mb-7 flex flex-col items-center gap-3 text-center">
            <AiPortfolioSparkIcon :size="46" :speed="0.8" />

            <div class="space-y-2">
              <DialogTitle
                class="text-2xl leading-tight font-semibold text-[#fff4e6]"
              >
                Welcome, {{ props.displayName }}
              </DialogTitle>
              <DialogDescription class="mx-auto max-w-sm text-sm leading-6 text-[#d3c0ab]">
                Your workspace is ready. Let's personalize your profile, agent defaults, and preferences so the portfolio assistant knows how to help you.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter class="sm:justify-center">
            <Button
              type="button"
              :disabled="props.loading"
              class="w-full bg-[#b87449] text-white shadow-none hover:bg-[#c6845a] disabled:opacity-60 sm:w-auto"
              @click="handleDismiss"
            >
              {{ props.loading ? 'Preparing settings...' : 'Continue to settings' }}
            </Button>
          </DialogFooter>
        </div>

        <div class="relative hidden overflow-hidden border-l border-[#4a433d] bg-[#221f1d] md:block">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,#5f4c3f_0%,transparent_45%),linear-gradient(180deg,#2c2825_0%,#1f1c1a_100%)]" />
          <div class="relative flex h-full flex-col justify-between p-8 text-[#efdcc5]">
            <div class="space-y-3">
              <div class="text-[11px] font-medium tracking-[0.2em] text-[#8f857a] uppercase">
                Portfolio Workspace
              </div>
              <div class="max-w-xs text-3xl leading-tight" style="font-family: var(--font-serif);">
                Set your defaults once. Let the assistant carry the context.
              </div>
            </div>

            <ul class="space-y-3 text-sm text-[#d3c0ab]">
              <li class="flex gap-2">
                <span class="text-[#d47f55]">-</span>
                <span>Confirm profile and contact details.</span>
              </li>
              <li class="flex gap-2">
                <span class="text-[#d47f55]">-</span>
                <span>Choose your default agent and model.</span>
              </li>
              <li class="flex gap-2">
                <span class="text-[#d47f55]">-</span>
                <span>Prepare your knowledge base for RAG.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
