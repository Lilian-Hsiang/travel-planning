import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig().public.firebase
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  const analytics = (await isSupported()) ? getAnalytics(app) : null
  const auth = getAuth(app)

  return {
    provide: {
      firebaseApp: app,
      firebaseAnalytics: analytics,
      firebaseAuth: auth,
    },
  }
})