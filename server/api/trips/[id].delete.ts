import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })
    
    const { docRef, role } = await ensureTripAccess(event, id, 'owner')

    if (role !== 'owner') {
      throw createError({ statusCode: 403, message: '只有擁有者可以刪除旅程' })
    }

    await docRef.delete()
    
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})