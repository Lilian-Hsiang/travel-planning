import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 驗證使用者身分
    const user = await requireAuth(event)

    // 查詢 'trips' 集合，並只抓取屬於該使用者的資料
    const snapshot = await firestore()
      .collection('trips')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get()
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})