import { ensureTripAccess } from '../../../../utils/tripAccess'

type LinkRolePayload = {
  role?: 'viewer' | 'editor'
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    const { docRef } = await ensureTripAccess(event, id, 'editor')

    const body = (await readBody(event)) as LinkRolePayload
    const role = body.role === 'editor' ? 'editor' : 'viewer'
    const timestamp = new Date().toISOString()

    await docRef.update({ shareLinkRole: role, updatedAt: timestamp })

    return { shareLinkRole: role }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
