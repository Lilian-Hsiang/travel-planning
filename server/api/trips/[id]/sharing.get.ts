import { ensureTripAccess } from '../../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    const { tripData, role, docRef } = await ensureTripAccess(event, id, 'viewer')

    const collaborators = Array.isArray(tripData.collaborators) ? tripData.collaborators : []
    const shareLinkRole = tripData.shareLinkRole || 'viewer'
    const normalizedEmails = Array.from(
      new Set(
        collaborators
          .map((collab) => (collab.email ? collab.email.toLowerCase() : ''))
          .filter((value) => Boolean(value))
      )
    )

    const shouldBackfillEmails = !Array.isArray(tripData.collaboratorEmails)
      || normalizedEmails.length !== tripData.collaboratorEmails.length
      || normalizedEmails.some((email) => !tripData.collaboratorEmails.includes(email))

    if (shouldBackfillEmails && normalizedEmails.length) {
      await docRef.update({ collaboratorEmails: normalizedEmails, updatedAt: new Date().toISOString() })
    }

    return {
      collaborators,
      shareLinkRole,
      canManage: role === 'owner' || role === 'editor',
    }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
