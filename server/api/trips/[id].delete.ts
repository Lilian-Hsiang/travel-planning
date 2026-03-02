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
    
    // 檢查權限：只有建立者可以刪除
    if (doc.data()?.userId !== user.uid) {
      throw createError({ statusCode: 403, message: 'Forbidden: You do not have permission to delete this trip' })
    }
    
    // 刪除指定的旅程
    await docRef.delete()
    
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})