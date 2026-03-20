<script setup lang="ts">
const cardRef = ref<HTMLElement | null>(null)
const rotateX = ref(0)
const rotateY = ref(0)

const handlePointerMove = (event: PointerEvent) => {
  const element = cardRef.value

  if (!element) {
    return
  }

  const bounds = element.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5

  rotateY.value = x * 12
  rotateX.value = y * -10
}

const resetTilt = () => {
  rotateX.value = 0
  rotateY.value = 0
}
</script>

<template>
  <div class="relative flex justify-center">
    <div class="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.18),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(217,70,239,0.14),transparent_28%)] blur-3xl" />
    <div
      ref="cardRef"
      class="relative rounded-full p-[3px] transition-transform duration-300 ease-out"
      :style="{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }"
      @pointermove="handlePointerMove"
      @pointerleave="resetTilt"
    >
      <div class="rounded-full bg-gradient-to-br from-white via-white to-zinc-200 p-2 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)]">
        <div class="relative flex size-40 items-center justify-center overflow-hidden rounded-full border border-zinc-300 bg-[radial-gradient(circle_at_30%_30%,#5f4c43,transparent_30%),linear-gradient(180deg,#f7f4ef_0%,#ebe5dd_100%)] md:size-48">
          <div class="absolute inset-x-7 top-8 h-12 rounded-[45%] bg-[linear-gradient(180deg,#4a3529_0%,#6f5646_100%)]" />
          <div class="absolute left-12 top-16 size-4 rounded-full bg-[#f7d2b8]" />
          <div class="absolute right-12 top-16 size-4 rounded-full bg-[#f7d2b8]" />
          <div class="absolute left-1/2 top-14 h-24 w-24 -translate-x-1/2 rounded-[46%] bg-[#f6dcc8]" />
          <div class="absolute left-[4.75rem] top-[5.35rem] h-2 w-2 rounded-full bg-zinc-800" />
          <div class="absolute right-[4.75rem] top-[5.35rem] h-2 w-2 rounded-full bg-zinc-800" />
          <div class="absolute left-1/2 top-[6.4rem] h-3 w-4 -translate-x-1/2 rounded-full border-b-2 border-zinc-700/70" />
          <div class="absolute left-1/2 top-[7.35rem] h-2 w-8 -translate-x-1/2 rounded-full border-b-2 border-zinc-700/70" />
          <div class="absolute inset-0 animate-[float_6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_60%_35%,rgba(255,255,255,0.5),transparent_28%)]" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}
</style>
