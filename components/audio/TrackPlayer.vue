<script setup lang="ts">
import type { ClientTrack } from '~~/composables/useTrackManifest'

const props = defineProps<{ track: ClientTrack }>()
const manifest = useTrackManifest()
const player = useAudioPlayer()

function toggle() {
  player.toggle(props.track.id, manifest.trackUrls(props.track))
}

const isCurrent = computed(() => player.state.value.trackId === props.track.id)
const isPlaying = computed(() => isCurrent.value && player.state.value.isPlaying)
</script>

<template>
  <div class="track-player">
    <button @click="toggle">
      {{ isPlaying ? 'Pause' : isCurrent ? 'Resume' : 'Play' }}
    </button>
    <span class="title">{{ track.title }}</span>
  </div>
</template>

<style scoped>
.track-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(228, 228, 231, 0.05);
  border-radius: 6px;
}
button {
  background: rgba(228, 228, 231, 0.85);
  color: #0a0b0e;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
}
.title {
  color: #e4e4e7;
  font-size: 0.9rem;
}
</style>
