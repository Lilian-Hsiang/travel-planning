import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

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
    const body = await readBody(event)

    if (!body?.tripId) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    if (!body?.itemName) {
      throw createError({ statusCode: 400, message: '請輸入記帳項目名稱' })
    }

    const { user } = await ensureTripAccess(event, String(body.tripId), 'editor')

    const data = {
      tripId: String(body.tripId),
      itemName: String(body.itemName).trim(),
      totalAmount: Number(body.totalAmount) || 0,
      payer: String(body.payer || '').trim(),
      notes: String(body.notes || '').trim(),
      splits: normalizeSplits(Array.isArray(body.splits) ? body.splits : []),
      userId: user.uid,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    }

    const docRef = await firestore().collection('ledgerEntries').add(data)
    return { id: docRef.id, ...data }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
