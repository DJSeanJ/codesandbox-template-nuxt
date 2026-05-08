<script setup lang="ts">
// Local dev preview. Iframes /embed?day=N positioned bottom-right; listens
// for postMessage 'resize' events from the widget so the iframe matches the
// widget's current size (small when bubble closed, large when panel open).
// Not deployed; mirrors the host-page snippet in public/embed-snippet.html.

const day = ref(1)
const days = [1, 2, 3]

const embedSrc = computed(() => `/embed?day=${day.value}`)

const iframeWidth = ref(88)
const iframeHeight = ref(88)
const iframeRef = ref<HTMLIFrameElement | null>(null)

interface ResizeMessage {
  source: 'lifeisgonnalife'
  type: 'resize'
  open: boolean
  width: number
  height: number
}

function isResizeMessage(data: unknown): data is ResizeMessage {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    obj.source === 'lifeisgonnalife' &&
    obj.type === 'resize' &&
    typeof obj.width === 'number' &&
    typeof obj.height === 'number'
  )
}

function onMessage(e: MessageEvent) {
  if (!iframeRef.value) return
  if (e.source !== iframeRef.value.contentWindow) return
  if (!isResizeMessage(e.data)) return
  iframeWidth.value = Math.min(e.data.width, window.innerWidth)
  iframeHeight.value = Math.min(e.data.height, window.innerHeight)
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))

useHead({ title: 'Dev preview — Life Is Gonna Life widget' })
</script>

<template>
  <main class="preview">
    <header class="preview-header">
      <h1>widget dev preview</h1>
      <p class="hint">
        This page simulates a GHL day-page; the widget is iframed at
        <code>/embed?day={{ day }}</code>. Switch days to test day-awareness.
      </p>
      <div class="day-switcher" role="group" aria-label="Day">
        <button
          v-for="d in days"
          :key="d"
          type="button"
          :class="{ active: d === day }"
          @click="day = d"
        >
          Day {{ d }}
        </button>
      </div>
    </header>

    <article class="mock-page">
      <h2>LIFE IS GONNA LIFE: DAY {{ day }}</h2>
      <p class="mock-section-label">PART ONE</p>
      <div class="mock-block">[ track title · audio embed · artist note ]</div>
      <p class="mock-section-label">PART TWO</p>
      <div class="mock-block">[ track title · audio embed · artist note ]</div>
      <p class="footer-note">
        Real GHL pages live at <code>test.djseanj.com/dayN-...</code>. The
        widget below is the same one that gets embedded into them.
      </p>
    </article>

    <iframe
      ref="iframeRef"
      :key="embedSrc"
      :src="embedSrc"
      class="widget-iframe"
      :style="{ width: `${iframeWidth}px`, height: `${iframeHeight}px` }"
      title="Chat widget preview"
      allowtransparency="true"
    />
  </main>
</template>

<style scoped>
.preview {
  min-height: 100vh;
  padding: 2rem 1.5rem 4rem;
  max-width: 760px;
  margin: 0 auto;
  color: #e4e4e7;
}
.preview-header {
  border-bottom: 1px solid rgba(228, 228, 231, 0.08);
  padding-bottom: 1.25rem;
  margin-bottom: 2rem;
}
.preview-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(228, 228, 231, 0.75);
}
.hint {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  color: rgba(228, 228, 231, 0.5);
}
.hint code {
  background: rgba(228, 228, 231, 0.08);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
.day-switcher {
  display: flex;
  gap: 0.5rem;
}
.day-switcher button {
  background: transparent;
  border: 1px solid rgba(228, 228, 231, 0.15);
  color: rgba(228, 228, 231, 0.7);
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.day-switcher button.active {
  background: rgba(228, 228, 231, 0.12);
  color: #e4e4e7;
  border-color: rgba(228, 228, 231, 0.3);
}
.mock-page h2 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
}
.mock-section-label {
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: rgba(228, 228, 231, 0.4);
  margin: 1.5rem 0 0.5rem;
}
.mock-block {
  background: rgba(228, 228, 231, 0.04);
  border: 1px dashed rgba(228, 228, 231, 0.08);
  padding: 2rem 1rem;
  border-radius: 6px;
  text-align: center;
  color: rgba(228, 228, 231, 0.35);
  font-size: 0.85rem;
}
.footer-note {
  margin-top: 3rem;
  font-size: 0.8rem;
  color: rgba(228, 228, 231, 0.4);
}
.footer-note code {
  background: rgba(228, 228, 231, 0.08);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.75rem;
}
.widget-iframe {
  position: fixed;
  right: 0;
  bottom: 0;
  border: 0;
  background: transparent;
  z-index: 100;
  transition: width 180ms ease, height 180ms ease;
}
</style>

<style>
html, body, #__nuxt {
  overflow: auto;
}
</style>
