import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!body?.tripId) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    const { user } = await ensureTripAccess(event, String(body.tripId), 'editor')

    const data = {
      ...body,
      userId: user.uid,
      createdBy: user.uid,
      tripId: String(body.tripId),
    }

    const docRef = await firestore().collection('itineraries').add(data)
    return { id: docRef.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})