import { auth } from '../../../../plugins/firebase-admin'
import { ensureTripAccess } from '../../../../utils/tripAccess'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type InvitePayload = {
  email: string
  role: 'viewer' | 'editor'
}

type CollaboratorEntry = {
  uid?: string
  email?: string
  role: 'viewer' | 'editor'
  invitedBy?: string
  invitedAt?: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, message: '缺少旅程 ID' })
    }

    const { docRef, tripData, user } = await ensureTripAccess(event, id, 'editor')

    const body = (await readBody(event)) as Partial<InvitePayload>
    const email = normalizeEmail(String(body.email || ''))
    const requestedRole = body.role === 'editor' ? 'editor' : 'viewer'

    if (!EMAIL_REGEX.test(email)) {
      throw createError({ statusCode: 422, message: '請輸入正確的 Email' })
    }

    if (tripData.ownerEmail && normalizeEmail(String(tripData.ownerEmail)) === email) {
      throw createError({ statusCode: 400, message: '擁有者已擁有此旅程，無需邀請' })
    }

    if (normalizeEmail(String(user.email || '')) === email) {
      throw createError({ statusCode: 400, message: '你已經擁有此旅程' })
    }

    let matchedUserUid: string | undefined
    try {
      const userRecord = await auth().getUserByEmail(email)
      matchedUserUid = userRecord.uid
      if (matchedUserUid === tripData.userId) {
        throw createError({ statusCode: 400, message: '擁有者已擁有此旅程，無需邀請' })
      }
    } catch (fetchError: any) {
      if (fetchError.code !== 'auth/user-not-found') {
        throw createError({ statusCode: 500, message: '查詢使用者資料時發生錯誤' })
      }
    }

    const collaborators: CollaboratorEntry[] = Array.isArray(tripData.collaborators)
      ? [...tripData.collaborators]
      : []

    const timestamp = new Date().toISOString()

    const newEntry: CollaboratorEntry = {
      email,
      role: requestedRole,
      invitedBy: user.uid,
      invitedAt: timestamp,
    }

    if (matchedUserUid) {
      newEntry.uid = matchedUserUid
    }

    const existingIndex = collaborators.findIndex((collab) => {
      if (matchedUserUid && collab.uid) {
        return collab.uid === matchedUserUid
      }
      if (collab.email && email) {
        return normalizeEmail(collab.email) === email
      }
      return false
    })

    if (existingIndex >= 0) {
      collaborators[existingIndex] = { ...collaborators[existingIndex], ...newEntry }
    } else {
      collaborators.push(newEntry)
    }

    const collaboratorUids = Array.from(
      new Set(
        collaborators
          .filter((collab) => Boolean(collab.uid))
          .map((collab) => String(collab.uid))
      )
    )

    const collaboratorEmails = Array.from(
      new Set(
        collaborators
          .map((collab) => normalizeEmail(collab.email || ''))
          .filter((value) => Boolean(value))
      )
    )

    await docRef.update({
      collaborators,
      collaboratorUids,
      collaboratorEmails,
      updatedAt: timestamp,
    })

    return { collaborators }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
