import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })
    
    const doc = await firestore().collection('trips').doc(id).get()
    if (!doc.exists) throw createError({ statusCode: 404, message: 'Trip not found' })
    
    const data = doc.data()
    // 檢查權限：只有建立者可以讀取
    if (data?.userId !== user.uid) {
      throw createError({ statusCode: 403, message: 'Forbidden: You do not have access to this trip' })
    }
    
    return { id: doc.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})