<script setup lang="ts">
const player = useAudioPlayer()
const manifest = useTrackManifest()

const currentTrack = computed(() => {
  const id = player.state.value.trackId
  return id ? manifest.findTrack(id) : undefined
})

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const progressPct = computed(() => {
  const d = player.state.value.duration
  return d > 0 ? (player.state.value.position / d) * 100 : 0
})

function onScrub(e: Event) {
  const target = e.target as HTMLInputElement
  const pct = Number(target.value) / 100
  if (player.state.value.duration > 0) {
    player.seek(pct * player.state.value.duration)
  }
}

function toggle() {
  if (!currentTrack.value) return
  player.toggle(currentTrack.value.id, manifest.trackUrls(currentTrack.value))
}
</script>

<template>
  <div v-if="currentTrack" class="dock">
    <button class="dock-btn" @click="toggle">
      {{ player.state.value.isPlaying ? '❚❚' : '▶' }}
    </button>
    <div class="dock-info">
      <p class="dock-title">{{ currentTrack.title }}</p>
      <input
        type="range"
        min="0"
        max="100"
        :value="progressPct"
        class="dock-scrub"
        @input="onScrub"
      />
    </div>
    <div class="dock-time">
      {{ fmt(player.state.value.position) }} / {{ fmt(player.state.value.duration) }}
    </div>
  </div>
</template>

<style scoped>
.dock {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(10, 11, 14, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(228, 228, 231, 0.08);
  border-radius: 10px;
  z-index: 20;
  color: #e4e4e7;
}
.dock-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid rgba(228, 228, 231, 0.2);
  background: transparent;
  color: #e4e4e7;
  cursor: pointer;
  font-size: 0.9rem;
}
.dock-info {
  flex: 1;
  min-width: 0;
}
.dock-title {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dock-scrub {
  width: 100%;
  accent-color: #e4e4e7;
}
.dock-time {
  font-size: 0.75rem;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 640px) {
  .dock-time { display: none; }
}
</style>
