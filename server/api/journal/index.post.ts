import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const tripId = body.tripId as string | undefined
    const { user } = await ensureTripAccess(event, tripId, 'editor')

    const data = {
      ...body,
      tripId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await firestore().collection('journals').add(data)
    return { id: docRef.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
