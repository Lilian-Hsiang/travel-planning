import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

    const docRef = firestore().collection('itineraries').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) throw createError({ statusCode: 404, message: 'Itinerary not found' })

    const tripId = doc.data()?.tripId
    if (!tripId) {
      throw createError({ statusCode: 400, message: '此行程缺少旅程 ID' })
    }

    await ensureTripAccess(event, String(tripId), 'editor')

    await docRef.delete()
    return { success: true, message: 'Deleted successfully' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})