import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })
    
    const docRef = firestore().collection('trips').doc(id)
    const doc = await docRef.get()
    
    if (!doc.exists) throw createError({ statusCode: 404, message: 'Trip not found' })
    
    // 檢查權限：只有建立者可以更新
    if (doc.data()?.userId !== user.uid) {
      throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to update this trip' })
    }
    
    const body = await readBody(event)
    // 確保 userId 不會被覆蓋
    delete body.userId
    
    await docRef.update(body)
    
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})