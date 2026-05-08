export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    anthropicApiKey: '',
    turnstileSecret: '',
    public: {
      audioBaseUrl: '/audio',
      turnstileSiteKey: '',
      brandName: 'Life Is Gonna Live',
    },
  },
  nitro: {
    storage: {
      sessions: { driver: 'fs', base: './.data/sessions' },
      cache: { driver: 'fs', base: './.data/cache' },
    },
  },
  app: {
    head: {
      title: 'Life Is Gonna Live',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'An interactive listening experience.' },
        { name: 'color-scheme', content: 'dark' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
})
