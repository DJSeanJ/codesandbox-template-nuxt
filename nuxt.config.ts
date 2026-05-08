export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    anthropicApiKey: '',
    public: {
      brandName: 'Life Is Gonna Life',
    },
  },
  routeRules: {
    // /embed is iframed into GHL day pages. Let any origin frame it for now;
    // in production, lock this down to the GHL/test.djseanj.com origin via
    // env-driven override.
    '/embed': {
      headers: {
        'Content-Security-Policy': "frame-ancestors *",
        'X-Frame-Options': '',
      },
    },
  },
  app: {
    head: {
      title: 'Life Is Gonna Life',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'A chat companion for the Life Is Gonna Life release.' },
        { name: 'color-scheme', content: 'dark' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
})
