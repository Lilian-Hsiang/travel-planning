import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'

export default defineNitroPlugin(() => {
  const { firebaseAdmin } = useRuntimeConfig()
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: firebaseAdmin.projectId,
        clientEmail: firebaseAdmin.clientEmail,
        privateKey: firebaseAdmin.privateKey,
      }),
    })
  }
})

export const firestore = () => getFirestore()
export const auth = () => getAdminAuth()