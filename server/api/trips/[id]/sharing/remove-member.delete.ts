import { ensureTripAccess } from '../../../../utils/tripAccess'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    const { docRef, tripData } = await ensureTripAccess(event, id, 'owner')

    const query = getQuery(event)
    const emailToRemove = normalizeEmail(String(query.email || ''))
    const uidToRemove = String(query.uid || '')

    if (!emailToRemove && !uidToRemove) {
      throw createError({ statusCode: 400, message: '請提供 email 或 uid' })
    }

    const collaborators = Array.isArray(tripData.collaborators) ? [...tripData.collaborators] : []

    const filteredCollaborators = collaborators.filter((collab) => {
      if (uidToRemove && collab.uid === uidToRemove) {
        return false
      }
      if (emailToRemove && collab.email && normalizeEmail(collab.email) === emailToRemove) {
        return false
      }
      return true
    })

    if (filteredCollaborators.length === collaborators.length) {
      throw createError({ statusCode: 404, message: '找不到該成員' })
    }

    const collaboratorUids = Array.from(
      new Set(
        filteredCollaborators
          .filter((collab) => Boolean(collab.uid))
          .map((collab) => String(collab.uid))
      )
    )

    const collaboratorEmails = Array.from(
      new Set(
        filteredCollaborators
          .map((collab) => normalizeEmail(collab.email || ''))
          .filter((value) => Boolean(value))
      )
    )

    const timestamp = new Date().toISOString()

    await docRef.update({
      collaborators: filteredCollaborators,
      collaboratorUids,
      collaboratorEmails,
      updatedAt: timestamp,
    })

    return { collaborators: filteredCollaborators }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
