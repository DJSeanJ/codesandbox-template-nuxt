<script setup lang="ts">
const entered = ref(false)

const session = useSession()
const chat = useChat()
const manifest = useTrackManifest()

async function enter() {
  entered.value = true
  await Promise.all([session.ensure(), manifest.load()])
  await chat.hydrateFromServer()
}

onMounted(async () => {
  await manifest.load()
})
</script>

<template>
  <div class="root">
    <ShellEntryGate v-if="!entered" @enter="enter" />
    <template v-else>
      <WorldAmbientCanvas />
      <ChatPanel />
      <AudioNowPlayingDock />
      <ShellAboutLink />
      <ShellSupportOverlay />
      <ShellSessionEnded />
    </template>
  </div>
</template>

<style scoped>
.root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
