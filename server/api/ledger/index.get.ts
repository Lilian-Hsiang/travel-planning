import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { tripId } = getQuery(event)

    const snapshot = await firestore()
      .collection('ledgerEntries')
      .where('userId', '==', user.uid)
      .get()

    let entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    entries = entries.sort((a: any, b: any) => {
      const aDate = a.createdAt || ''
      const bDate = b.createdAt || ''
      return bDate.localeCompare(aDate)
    })

    if (tripId) {
      const tripKey = String(tripId)
      entries = entries.filter((entry: any) => entry.tripId === tripKey)
    }

    return entries
  } catch (error: any) {
    console.error('Ledger GET failed:', error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
