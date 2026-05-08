<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <div class="about-wrapper">
    <button class="about-trigger" @click="open = true">About this work</button>
    <Transition name="fade">
      <div v-if="open" class="about-overlay" @click.self="open = false">
        <div class="about-card">
          <p>This is a work of metaphor. No statements about any real person are intended or should be inferred.</p>
          <button @click="open = false">Close</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.about-wrapper {
  position: fixed;
  bottom: 0.5rem;
  left: 1rem;
  z-index: 5;
}
.about-trigger {
  background: transparent;
  color: rgba(228, 228, 231, 0.5);
  border: none;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0.25rem;
}
.about-trigger:hover { color: rgba(228, 228, 231, 0.8); }
.about-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  z-index: 250;
}
.about-card {
  max-width: 22rem;
  margin: 1rem;
  padding: 2rem;
  background: #14161c;
  border: 1px solid rgba(228, 228, 231, 0.1);
  border-radius: 12px;
  color: #e4e4e7;
  text-align: center;
}
.about-card p { line-height: 1.6; margin: 0 0 1rem; }
.about-card button {
  background: rgba(228, 228, 231, 0.85);
  color: #0a0b0e;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1rem;
  cursor: pointer;
}
.fade-enter-active, .fade-leave-active { transition: opacity 200ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
