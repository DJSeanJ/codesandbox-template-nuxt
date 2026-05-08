<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [string] }>()

const text = ref('')

function submit() {
  if (props.disabled) return
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <form class="chat-input" @submit.prevent="submit">
    <textarea
      v-model="text"
      :disabled="disabled"
      rows="1"
      placeholder="Speak softly."
      maxlength="2000"
      @keydown="onKeydown"
    />
    <button type="submit" :disabled="disabled || !text.trim()">→</button>
  </form>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(228, 228, 231, 0.06);
}
textarea {
  flex: 1;
  background: rgba(228, 228, 231, 0.05);
  color: #e4e4e7;
  border: 1px solid rgba(228, 228, 231, 0.1);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font: inherit;
  resize: none;
  line-height: 1.4;
}
textarea:focus {
  outline: none;
  border-color: rgba(228, 228, 231, 0.25);
}
textarea:disabled {
  opacity: 0.5;
}
button {
  background: rgba(228, 228, 231, 0.85);
  color: #0a0b0e;
  border: none;
  border-radius: 6px;
  width: 2.5rem;
  font-size: 1.1rem;
  cursor: pointer;
}
button:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
