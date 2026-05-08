<script setup lang="ts">
import type { ChatMessage } from '~~/shared/types'

interface UiMessage extends ChatMessage {
  streaming?: boolean
}

defineProps<{ message: UiMessage }>()
</script>

<template>
  <div class="bubble" :class="message.role">
    <p>{{ message.content }}<span v-if="message.streaming" class="caret">▍</span></p>
  </div>
</template>

<style scoped>
.bubble {
  max-width: 90%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e4e4e7;
}
.bubble.user {
  align-self: flex-end;
  background: rgba(228, 228, 231, 0.1);
}
.bubble.assistant {
  align-self: flex-start;
  background: transparent;
}
.bubble p {
  margin: 0;
  white-space: pre-wrap;
}
.caret {
  opacity: 0.5;
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
</style>
