<script setup lang="ts">
const route = useRoute()

const day = computed(() => {
  const raw = route.query.day
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
})

definePageMeta({ layout: false })

useHead({
  // The page is iframed and visually transparent — only the floating widget
  // shows. Keep the background of the page itself transparent so the GHL
  // page beneath shows through.
  bodyAttrs: { class: 'embed-body' },
})
</script>

<template>
  <WidgetLauncher :day="day" />
</template>

<style>
body.embed-body,
html:has(body.embed-body),
.embed-body #__nuxt {
  background: transparent !important;
  margin: 0;
  padding: 0;
}
</style>
