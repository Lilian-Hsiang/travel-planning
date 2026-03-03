import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const tripId = getQuery(event).tripId as string | undefined

    let query = firestore().collection('journals').where('userId', '==', user.uid)
    if (tripId) query = query.where('tripId', '==', tripId)

    const snapshot = await query.get()
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
