import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, message: '缺少記帳 ID' })
    }

    const docRef = firestore().collection('ledgerEntries').doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw createError({ statusCode: 404, message: 'Ledger entry not found' })
    }

    const tripId = docSnap.data()?.tripId
    if (!tripId) {
      throw createError({ statusCode: 400, message: '此記帳缺少旅程 ID' })
    }

    await ensureTripAccess(event, String(tripId), 'editor')

    await docRef.delete()
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
