<script setup lang="ts">
import type { ChatMessage } from '~~/shared/types'

interface UiMessage extends ChatMessage {
  streaming?: boolean
}

const props = defineProps<{ messages: UiMessage[] }>()

const scrollEl = ref<HTMLElement | null>(null)

watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      if (scrollEl.value) {
        scrollEl.value.scrollTop = scrollEl.value.scrollHeight
      }
    })
  },
)
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    if (scrollEl.value) {
      scrollEl.value.scrollTop = scrollEl.value.scrollHeight
    }
  },
)
</script>

<template>
  <div ref="scrollEl" class="message-list">
    <ChatMessageBubble
      v-for="(m, i) in messages"
      :key="i"
      :message="m"
    />
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.message-list::-webkit-scrollbar {
  width: 4px;
}
.message-list::-webkit-scrollbar-thumb {
  background: rgba(228, 228, 231, 0.15);
  border-radius: 2px;
}
</style>
