import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 驗證使用者身分
    const user = await requireAuth(event)
    
    const body = await readBody(event)
    
    // 寫入資料時，強制綁定 userId
    const tripData = {
      ...body,
      userId: user.uid,
      createdAt: new Date().toISOString()
    }
    
    const docRef = await firestore().collection('trips').add(tripData)
    return { id: docRef.id, ...tripData }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})