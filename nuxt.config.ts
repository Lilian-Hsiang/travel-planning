// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
