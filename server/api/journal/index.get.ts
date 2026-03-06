import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const tripId = getQuery(event).tripId as string | undefined
    await ensureTripAccess(event, tripId, 'viewer')

    const snapshot = await firestore()
      .collection('journals')
      .where('tripId', '==', tripId)
      .get()
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Sort in memory to avoid needing a Firestore Composite Index
    records.sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      return dateB.localeCompare(dateA) // Descending
    })

    return records
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
