import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)

    // 寫入時強制綁定 userId
    const data = {
      ...body,
      userId: user.uid,
    }

    const docRef = await firestore().collection('itineraries').add(data)
    return { id: docRef.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})