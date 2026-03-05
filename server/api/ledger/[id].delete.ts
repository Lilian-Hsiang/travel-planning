import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({ statusCode: 400, message: '缺少記帳 ID' })
    }

    const docRef = firestore().collection('ledgerEntries').doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw createError({ statusCode: 404, message: 'Ledger entry not found' })
    }

    if (docSnap.data()?.userId !== user.uid) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    await docRef.delete()
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
