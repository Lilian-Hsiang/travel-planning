// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  plugins: ['~/plugins/fontawesome'],
  
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '旅遊規劃',
      short_name: '旅遊規劃',
      description: '與好友一起規劃您的完美旅程',
      theme_color: '#FFD283',
      background_color: '#fff5e3',
      display: 'standalone',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module'
    }
  },

  runtimeConfig: {
    firebaseAdmin: {
      projectId: process.env.NUXT_FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.NUXT_FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.NUXT_FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    public: {
      firebase: {
        apiKey: process.env.NUXT_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_FIREBASE_APP_ID,
        measurementId: process.env.NUXT_FIREBASE_MEASUREMENT_ID,
      },
    },
  },
})
