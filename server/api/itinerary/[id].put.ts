import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: '缺少行程 ID' })

    const docRef = firestore().collection('itineraries').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) throw createError({ statusCode: 404, message: 'Itinerary not found' })

    const tripId = doc.data()?.tripId
    if (!tripId) {
      throw createError({ statusCode: 400, message: '此行程缺少旅程 ID' })
    }

    await ensureTripAccess(event, String(tripId), 'editor')

    const body = await readBody(event)
    delete body.userId // 防止覆蓋 userId
    delete body.tripId

    await docRef.update(body)

    return { success: true, message: '更新成功', id, ...body }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})