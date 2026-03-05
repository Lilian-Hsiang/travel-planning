import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'

const normalizeSplits = (splits: any[] = []) => {
  return splits.map((split) => ({
    id: split?.id || Math.random().toString(36).slice(2, 9),
    name: String(split?.name || '').trim(),
    amount: Number(split?.amount) || 0,
    isSettled: Boolean(split?.isSettled),
  }))
}

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

    const body = await readBody(event)
    const updates: Record<string, any> = { ...body }
    delete updates.userId
    delete updates.createdAt

    if (Object.prototype.hasOwnProperty.call(updates, 'itemName')) {
      updates.itemName = String(updates.itemName || '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'totalAmount')) {
      updates.totalAmount = Number(updates.totalAmount) || 0
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'payer')) {
      updates.payer = String(updates.payer || '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
      updates.notes = String(updates.notes || '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'splits')) {
      updates.splits = normalizeSplits(Array.isArray(updates.splits) ? updates.splits : [])
    }

    await docRef.update(updates)

    return { success: true, id, ...updates }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
