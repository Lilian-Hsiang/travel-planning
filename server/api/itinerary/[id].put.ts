import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: '缺少行程 ID' })

    const docRef = firestore().collection('itineraries').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) throw createError({ statusCode: 404, message: 'Itinerary not found' })

    // 確認為資料擁有者
    if (doc.data()?.userId !== user.uid) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    const body = await readBody(event)
    delete body.userId // 防止覆蓋 userId

    await docRef.update(body)

    return { success: true, message: '更新成功', id, ...body }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})