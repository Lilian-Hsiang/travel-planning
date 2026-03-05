import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

    const { docRef } = await ensureTripAccess(event, id, 'editor')

    const body = await readBody(event)
    // 確保受保護欄位不被覆蓋
    delete body.userId
    delete body.collaborators
    delete body.collaboratorUids
    delete body.inviteTokens
    delete body.collaboratorEmails

    await docRef.update(body)

    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})