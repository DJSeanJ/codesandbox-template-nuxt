<script setup lang="ts">
const props = defineProps<{ day: number }>()
const isOpen = ref(false)

// Closed = just enough room for the 56px bubble + a little padding.
// Open  = panel (380×560) + 16px margin on right/bottom.
// Mobile is handled by the embed-snippet's CSS, not here.
const SIZE_CLOSED = { width: 88, height: 88 } as const
const SIZE_OPEN = { width: 412, height: 592 } as const

function postSize(open: boolean) {
  if (typeof window === 'undefined' || window.parent === window) return
  const size = open ? SIZE_OPEN : SIZE_CLOSED
  window.parent.postMessage(
    {
      source: 'lifeisgonnalife',
      type: 'resize',
      open,
      width: size.width,
      height: size.height,
    },
    '*',
  )
}

function open() {
  isOpen.value = true
}
function close() {
  isOpen.value = false
}

watch(isOpen, (val) => postSize(val))
onMounted(() => postSize(isOpen.value))
</script>

<template>
  <div class="launcher">
    <Transition name="fade">
      <WidgetBubble v-if="!isOpen" key="bubble" @open="open" />
    </Transition>
    <WidgetPanel :day="props.day" :open="isOpen" @close="close" />
  </div>
</template>

<style scoped>
.launcher {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483640;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: auto;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(4px);
}
</style>
