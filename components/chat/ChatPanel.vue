<script setup lang="ts">
const chat = useChat()
const ended = useSessionEnded()
</script>

<template>
  <aside class="chat-panel">
    <header class="chat-header">
      <WorldProgressConstellation />
    </header>
    <ChatMessageList :messages="chat.messages.value" />
    <ChatTypingIndicator v-if="chat.streaming.value" />
    <ChatInput
      :disabled="chat.streaming.value || ended"
      @send="(t) => chat.send(t)"
    />
  </aside>
</template>

<style scoped>
.chat-panel {
  position: fixed;
  right: 1rem;
  top: 1rem;
  bottom: 6rem;
  width: min(420px, calc(100vw - 2rem));
  display: flex;
  flex-direction: column;
  background: rgba(10, 11, 14, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(228, 228, 231, 0.08);
  border-radius: 12px;
  z-index: 10;
  overflow: hidden;
}
.chat-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(228, 228, 231, 0.06);
  display: flex;
  justify-content: center;
}
@media (max-width: 640px) {
  .chat-panel {
    right: 0;
    left: 0;
    top: auto;
    bottom: 4.5rem;
    width: 100%;
    height: 70vh;
    border-radius: 12px 12px 0 0;
    border-bottom: none;
  }
}
</style>
