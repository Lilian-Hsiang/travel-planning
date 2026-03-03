import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

    const docRef = firestore().collection('journals').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) throw createError({ statusCode: 404, message: 'Not found' })
    if (doc.data()?.userId !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

    const body = await readBody(event)
    delete body.userId // Prevent overriding userId

    await docRef.update(body)
    return { success: true, id, ...body }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
