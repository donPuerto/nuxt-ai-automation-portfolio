<template>
  <ParentSize
    :parent-size-styles="parentSizeStyles"
    :debounce-time="50"
    v-bind="$attrs"
  >
    <template #default>
      <canvas
        ref="canvasRef"
        :style="canvasStyle"
      />
      <slot v-if="isLoading" />
    </template>
  </ParentSize>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick, type CSSProperties } from "vue";
import { Application, type SplineEventName } from "@splinetool/runtime";
import { useDebounceFn, useIntersectionObserver } from "@vueuse/core";
import ParentSize from "./ParentSize.vue";

const props = defineProps({
  scene: {
    type: String,
    required: true,
  },
  onLoad: Function,
  renderOnDemand: {
    type: Boolean,
    default: true,
  },
  style: Object,
});

const emit = defineEmits([
  "error",
  "spline-mouse-down",
  "spline-mouse-up",
  "spline-mouse-hover",
  "spline-key-down",
  "spline-key-up",
  "spline-start",
  "spline-look-at",
  "spline-follow",
  "spline-scroll",
]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(false);
const splineApp = ref<Application | null>(null);
const isVisible = ref(true);

let cleanup: () => void = () => {};

const parentSizeStyles = computed(() => ({
  overflow: "visible",
  margin: 0,
  padding: 0,
  ...props.style,
}));

const canvasStyle = computed<CSSProperties>(() => ({
  display: "block",
  width: "100%",
  height: "100%",
  margin: 0,
  padding: 0,
  touchAction: "none",
  userSelect: "none",
}));

// Use IntersectionObserver to detect when component is visible
const { stop: stopIntersectionObserver } = useIntersectionObserver(
  canvasRef,
  (entries) => {
    const isIntersecting = entries[0]?.isIntersecting ?? false;
    isVisible.value = isIntersecting;
    if (isIntersecting && splineApp.value) {
      // When becoming visible again, force a resize
      nextTick(() => {
        if (canvasRef.value && splineApp.value) {
          splineApp.value.requestRender();
          const width = canvasRef.value.clientWidth;
          const height = canvasRef.value.clientHeight;
          splineApp.value.setSize(width, height);
        }
      });
    }
  },
  { threshold: 0.01 }, // Lower threshold for better mobile detection
);

function eventHandler(name: SplineEventName, handler?: (e: unknown) => void) {
  if (!handler || !splineApp.value) return;
  const debouncedHandler = useDebounceFn(handler, 50, { maxWait: 100 });
  splineApp.value.addEventListener(name, debouncedHandler);
  return () => splineApp.value?.removeEventListener(name, debouncedHandler);
}

async function initSpline() {
  if (!canvasRef.value) return;

  isLoading.value = true;

  try {
    // Clean up previous instance if exists
    if (splineApp.value) {
      splineApp.value.dispose();
      splineApp.value = null;
    }

    splineApp.value = new Application(canvasRef.value, {
      renderOnDemand: props.renderOnDemand,
    });

    await splineApp.value.load(props.scene);

    // Set up event listeners
    const cleanUpFns = [
      eventHandler("mouseDown", (e: unknown) => emit("spline-mouse-down", e)),
      eventHandler("mouseUp", (e: unknown) => emit("spline-mouse-up", e)),
      eventHandler("mouseHover", (e: unknown) => emit("spline-mouse-hover", e)),
      eventHandler("keyDown", (e: unknown) => emit("spline-key-down", e)),
      eventHandler("keyUp", (e: unknown) => emit("spline-key-up", e)),
      eventHandler("start", (e: unknown) => emit("spline-start", e)),
      eventHandler("lookAt", (e: unknown) => emit("spline-look-at", e)),
      eventHandler("follow", (e: unknown) => emit("spline-follow", e)),
      eventHandler("scroll", (e: unknown) => emit("spline-scroll", e)),
    ].filter(Boolean);

    isLoading.value = false;
    props.onLoad?.(splineApp.value);

    return () => {
      cleanUpFns.forEach((fn) => fn?.());
    };
  } catch (err) {
    console.error("Spline initialization error:", err);
    emit("error", err);
    isLoading.value = false;
    return () => {};
  }
}

async function initialize() {
  cleanup();
  cleanup = (await initSpline()) ?? (() => {});
}

onMounted(async () => {
  await initialize();

  // Reinitialize when becoming visible again
  watch(isVisible, (visible) => {
    if (visible) {
      initialize();
    }
  });
});

onUnmounted(() => {
  stopIntersectionObserver();
  if (splineApp.value) {
    splineApp.value.dispose();
    splineApp.value = null;
  }
});
</script>
