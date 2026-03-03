import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

    const docRef = firestore().collection('food').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) throw createError({ statusCode: 404, message: 'Not found' })
    if (doc.data()?.userId !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

    await docRef.delete()
    return { success: true, message: 'Deleted' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
