import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 驗證使用者身分
    const user = await requireAuth(event)
    
    const body = await readBody(event)
    
    const timestamp = new Date().toISOString()

    // 寫入資料時，強制綁定 userId 並初始化協作欄位
    const tripData = {
      ...body,
      userId: user.uid,
      ownerEmail: user.email || null,
      collaborators: [],
      collaboratorUids: [],
      collaboratorEmails: [],
      inviteTokens: [],
      shareLinkRole: 'viewer',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    
    const docRef = await firestore().collection('trips').add(tripData)
    return { id: docRef.id, ...tripData, accessRole: 'owner' }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})