<script setup lang="ts">
const ended = useSessionEnded()
const farewell = useFarewell()
</script>

<template>
  <Transition name="fade">
    <div v-if="ended" class="ended-overlay">
      <div class="ended-card">
        <p v-if="farewell" class="farewell">{{ farewell }}</p>
        <p class="thanks">Thank you for being here.</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ended-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 11, 14, 0.8);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  z-index: 150;
}
.ended-card {
  max-width: 24rem;
  padding: 2rem;
  text-align: center;
  color: #e4e4e7;
}
.farewell {
  font-size: 1.1rem;
  line-height: 1.6;
  font-style: italic;
  opacity: 0.9;
}
.thanks {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  opacity: 0.6;
}
.fade-enter-active, .fade-leave-active { transition: opacity 400ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
