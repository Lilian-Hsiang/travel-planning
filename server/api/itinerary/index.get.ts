import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const tripId = getQuery(event).tripId as string | undefined

    let query = firestore()
      .collection('itineraries')
      .where('userId', '==', user.uid) as FirebaseFirestore.Query

    if (tripId) {
      query = query.where('tripId', '==', tripId)
    }

    const snapshot = await query.orderBy('day').orderBy('time').get()
    const itineraries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return itineraries
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})