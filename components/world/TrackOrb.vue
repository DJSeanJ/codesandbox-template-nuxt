<script setup lang="ts">
import type { ClientTrack } from '~~/composables/useTrackManifest'

const props = defineProps<{
  track: ClientTrack
  revealed: boolean
}>()

const manifest = useTrackManifest()
const player = useAudioPlayer()

function activate() {
  if (!props.revealed) return
  player.toggle(props.track.id, manifest.trackUrls(props.track))
}

const isCurrent = computed(
  () => player.state.value.trackId === props.track.id && player.state.value.isPlaying,
)
</script>

<template>
  <button
    class="orb"
    :class="{ revealed, current: isCurrent }"
    :disabled="!revealed"
    :title="revealed ? track.title : 'Not yet'"
    @click="activate"
  >
    <span class="orb-core" />
    <span v-if="revealed" class="orb-label">{{ track.title }}</span>
  </button>
</template>

<style scoped>
.orb {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}
.orb:disabled {
  cursor: default;
}
.orb-core {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(228, 228, 231, 0.12);
  box-shadow: 0 0 0 1px rgba(228, 228, 231, 0.2);
  transition: all 400ms ease;
}
.orb.revealed .orb-core {
  background: rgba(228, 228, 231, 0.85);
  box-shadow: 0 0 24px rgba(228, 228, 231, 0.5);
}
.orb.current .orb-core {
  background: #fff;
  box-shadow: 0 0 36px rgba(255, 255, 255, 0.7);
  animation: pulse 1800ms ease-in-out infinite;
}
.orb-label {
  font-size: 0.7rem;
  color: rgba(228, 228, 231, 0.7);
  letter-spacing: 0.05em;
  white-space: nowrap;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
