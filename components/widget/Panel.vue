<script setup lang="ts">
const props = defineProps<{ day: number; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const chat = useChat(toRef(props, 'day'))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section v-show="open" class="panel" role="dialog" aria-label="Chat with the artist">
    <header class="panel-header">
      <span class="panel-label">talking — day {{ day }}</span>
      <button
        class="close"
        type="button"
        aria-label="Close chat"
        @click="emit('close')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>

    <ChatMessageList :messages="chat.messages.value" class="panel-messages" />

    <ChatTypingIndicator v-if="chat.streaming.value && !lastIsAssistantWithText(chat.messages.value)" />

    <ChatInput
      :disabled="chat.streaming.value"
      @send="(t) => chat.send(t)"
    />
  </section>
</template>

<script lang="ts">
import type { ChatMessage } from '~~/shared/types'

interface UiMessage extends ChatMessage {
  streaming?: boolean
}

function lastIsAssistantWithText(messages: UiMessage[]): boolean {
  const last = messages[messages.length - 1]
  return !!last && last.role === 'assistant' && last.content.length > 0
}
</script>

<style scoped>
.panel {
  width: 380px;
  height: 560px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: rgba(10, 11, 14, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(228, 228, 231, 0.1);
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(228, 228, 231, 0.06);
}
.panel-label {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: rgba(228, 228, 231, 0.55);
  text-transform: lowercase;
}
.close {
  background: transparent;
  border: none;
  color: rgba(228, 228, 231, 0.55);
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 120ms ease, color 120ms ease;
}
.close:hover {
  background: rgba(228, 228, 231, 0.06);
  color: rgba(228, 228, 231, 0.85);
}
.close:focus-visible {
  outline: 2px solid rgba(228, 228, 231, 0.4);
  outline-offset: 1px;
}
.panel-messages {
  flex: 1;
  min-height: 0;
}
@media (max-width: 480px) {
  .panel {
    width: calc(100vw - 16px);
    height: calc(100vh - 80px);
    max-height: calc(100vh - 80px);
  }
}
</style>
