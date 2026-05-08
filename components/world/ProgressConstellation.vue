<script setup lang="ts">
const manifest = useTrackManifest()
const revealed = useRevealedTracks()

const total = computed(() => manifest.data.value.tracks.length)
const lit = computed(() => revealed.list.value.length)
</script>

<template>
  <div class="constellation" :title="`${lit} of ${total} revealed`">
    <span
      v-for="t in manifest.data.value.tracks"
      :key="t.id"
      class="dot"
      :class="{ lit: revealed.has(t.id) }"
    />
  </div>
</template>

<style scoped>
.constellation {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(228, 228, 231, 0.2);
  transition: background 400ms ease;
}
.dot.lit {
  background: rgba(228, 228, 231, 0.9);
  box-shadow: 0 0 6px rgba(228, 228, 231, 0.6);
}
</style>
