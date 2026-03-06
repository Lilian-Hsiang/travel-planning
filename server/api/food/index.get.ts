import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const tripId = getQuery(event).tripId as string | undefined
    await ensureTripAccess(event, tripId, 'viewer')

    const snapshot = await firestore()
      .collection('food')
      .where('tripId', '==', tripId)
      .get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
