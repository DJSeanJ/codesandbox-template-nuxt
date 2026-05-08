<script setup lang="ts">
const mood = useWorldMood()
const manifest = useTrackManifest()
const revealed = useRevealedTracks()

const moodColors: Record<string, [string, string]> = {
  arrival: ['#1a1d24', '#0a0b0e'],
  dawn: ['#3a2e2a', '#1a1410'],
  storm: ['#1d2330', '#0a0d14'],
  still: ['#1a1f24', '#0c0f12'],
  embers: ['#3a201a', '#1a0c08'],
  low_tide: ['#1a2628', '#0a1416'],
  late_winter: ['#22262e', '#0d1015'],
  threshold: ['#2a2030', '#120a18'],
  hush: ['#1c1e22', '#0a0b0e'],
}

const gradient = computed(() => {
  const [a, b] = moodColors[mood.value] ?? moodColors.arrival
  return `radial-gradient(ellipse at 30% 40%, ${a} 0%, ${b} 70%)`
})

function orbPosition(order: number, total: number) {
  if (total <= 1) return { left: '50%', top: '50%' }
  const t = (order - 1) / Math.max(1, total - 1)
  const x = 15 + t * 70
  const y = 30 + Math.sin(t * Math.PI * 1.5) * 25
  return { left: `${x}%`, top: `${y}%` }
}
</script>

<template>
  <div class="ambient-canvas" :style="{ background: gradient }">
    <div
      v-for="t in manifest.data.value.tracks"
      :key="t.id"
      class="orb-anchor"
      :style="orbPosition(t.order, manifest.data.value.tracks.length)"
    >
      <WorldTrackOrb
        :track="t"
        :revealed="revealed.has(t.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.ambient-canvas {
  position: fixed;
  inset: 0;
  transition: background 1500ms ease;
  z-index: 0;
}
.orb-anchor {
  position: absolute;
  transform: translate(-50%, -50%);
}
</style>
