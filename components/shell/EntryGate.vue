<script setup lang="ts">
const emit = defineEmits<{ enter: [] }>()
const config = useRuntimeConfig()
const brand = config.public.brandName
</script>

<template>
  <div class="entry-gate">
    <div class="entry-inner">
      <h1 class="entry-title">{{ brand }}</h1>
      <p class="entry-sub">An interactive listening experience.</p>
      <button class="entry-button" @click="emit('enter')">Enter</button>
      <p class="entry-fine">
        Best with headphones. This is a work of metaphor — no statements about
        any real person are intended or should be inferred.
      </p>
    </div>
  </div>
</template>

<style scoped>
.entry-gate {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(ellipse at center, #1a1d24 0%, #0a0b0e 70%);
  z-index: 100;
}
.entry-inner {
  max-width: 28rem;
  padding: 2rem;
  text-align: center;
  color: #e4e4e7;
}
.entry-title {
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  margin: 0 0 0.5rem;
}
.entry-sub {
  font-size: 0.95rem;
  opacity: 0.7;
  margin: 0 0 2rem;
}
.entry-button {
  background: transparent;
  color: #e4e4e7;
  border: 1px solid #52525b;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 200ms ease;
}
.entry-button:hover {
  background: #e4e4e7;
  color: #0a0b0e;
}
.entry-fine {
  margin-top: 3rem;
  font-size: 0.75rem;
  opacity: 0.5;
  line-height: 1.6;
}
</style>
