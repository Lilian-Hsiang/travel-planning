import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const { tripId } = getQuery(event)
    if (!tripId) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    await ensureTripAccess(event, String(tripId), 'viewer')

    const snapshot = await firestore()
      .collection('ledgerEntries')
      .where('tripId', '==', String(tripId))
      .get()

    const entries = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aDate = a.createdAt || ''
        const bDate = b.createdAt || ''
        return bDate.localeCompare(aDate)
      })

    return entries
  } catch (error: any) {
    console.error('Ledger GET failed:', error)
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
