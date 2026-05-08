<script setup lang="ts">
defineEmits<{ open: [] }>()
</script>

<template>
  <button
    class="bubble"
    type="button"
    aria-label="Open chat"
    @click="$emit('open')"
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  </button>
</template>

<style scoped>
.bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #16171b;
  color: #e4e4e7;
  border: 1px solid rgba(228, 228, 231, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  transition: transform 120ms ease, background 120ms ease;
}
.bubble:hover {
  transform: translateY(-1px);
  background: #1c1d22;
}
.bubble:active {
  transform: translateY(0);
}
.bubble:focus-visible {
  outline: 2px solid rgba(228, 228, 231, 0.4);
  outline-offset: 2px;
}
</style>
