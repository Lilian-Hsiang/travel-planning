import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody(event)

    const data = {
      ...body,
      userId: user.uid,
      items: body.items || [], 
      createdAt: new Date().toISOString()
    }

    const docRef = await firestore().collection('shopping').add(data)
    return { id: docRef.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
