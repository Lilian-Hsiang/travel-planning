import { getHeader, createError } from 'h3'
import { auth } from '../plugins/firebase-admin'

export const requireAuth = async (event: any) => {
  const authorizationHeader = getHeader(event, 'Authorization')

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Missing or invalid Authorization header',
    })
  }

  const idToken = authorizationHeader.split('Bearer ')[1]

  try {
    const decodedToken = await auth().verifyIdToken(idToken)
    // 將解析出來的 user 資訊存入 event.context，方便後續的 API 處理常式使用
    event.context.user = decodedToken
    return decodedToken
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error)
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: Invalid token',
    })
  }
}
