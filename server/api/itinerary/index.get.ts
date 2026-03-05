import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const tripId = getQuery(event).tripId as string | undefined
    if (!tripId) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    await ensureTripAccess(event, String(tripId), 'viewer')

    const snapshot = await firestore()
      .collection('itineraries')
      .where('tripId', '==', String(tripId))
      .get()

    const itineraries = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const dayDiff = (a.day || 0) - (b.day || 0)
        if (dayDiff !== 0) return dayDiff
        return String(a.time || '00:00').localeCompare(String(b.time || '00:00'))
      })

    return itineraries
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})