<template>
  <div class="typing">
    <span /><span /><span />
  </div>
</template>

<style scoped>
.typing {
  display: flex;
  gap: 4px;
  padding: 0 1rem 0.5rem;
}
.typing span {
  width: 6px;
  height: 6px;
  background: rgba(228, 228, 231, 0.5);
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
