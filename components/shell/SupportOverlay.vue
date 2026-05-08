<script setup lang="ts">
const show = useShowSupport()
function close() {
  show.value = false
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="support-overlay" @click.self="close">
      <div class="support-card">
        <h2>If you're in crisis, please reach out.</h2>
        <p>You don't have to be alone with this.</p>
        <ul>
          <li><strong>988</strong> — Suicide & Crisis Lifeline (US)</li>
          <li><strong>Text HOME to 741741</strong> — Crisis Text Line</li>
          <li><strong>116 123</strong> — Samaritans (UK & Ireland)</li>
          <li>
            <a href="https://findahelpline.com" target="_blank" rel="noopener">
              findahelpline.com
            </a> — international directory
          </li>
        </ul>
        <button @click="close">Close</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.support-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  z-index: 200;
}
.support-card {
  max-width: 26rem;
  margin: 1rem;
  padding: 2rem;
  background: #14161c;
  border: 1px solid rgba(228, 228, 231, 0.1);
  border-radius: 12px;
  color: #e4e4e7;
}
h2 { margin-top: 0; font-size: 1.1rem; font-weight: 500; }
ul { padding-left: 1.25rem; line-height: 1.8; }
a { color: #93c5fd; }
button {
  margin-top: 1rem;
  background: rgba(228, 228, 231, 0.85);
  color: #0a0b0e;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
}
.fade-enter-active, .fade-leave-active { transition: opacity 200ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
