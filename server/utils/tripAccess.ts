import { firestore } from '../plugins/firebase-admin'
import { requireAuth } from './auth'

const ROLE_PRIORITY = {
  viewer: 1,
  editor: 2,
  owner: 3,
} as const

export type TripRole = keyof typeof ROLE_PRIORITY

export type CollaboratorRole = 'viewer' | 'editor'

type CollaboratorEntry = {
  uid?: string
  email?: string
  role: CollaboratorRole
}

export type TripAccessResult = {
  role: TripRole
  permissions: string[]
  user: any
  tripId: string
  tripData: Record<string, any>
  docRef: FirebaseFirestore.DocumentReference
}

const ALL_TAB_KEYS = ['itinerary', 'shopping', 'food', 'journal', 'ledger', 'luggage']

export const resolveTripRoleForUser = (tripData: Record<string, any>, user: any): { role: TripRole | null; permissions: string[] } => {
  if (tripData.userId === user.uid) {
    return { role: 'owner', permissions: [...ALL_TAB_KEYS] }
  }

  const collaborators: CollaboratorEntry[] = Array.isArray(tripData.collaborators)
    ? tripData.collaborators
    : []

  const match = collaborators.find((collab) => {
    if (collab.uid && user.uid) {
      return collab.uid === user.uid
    }
    if (collab.email && user.email) {
      return collab.email.toLowerCase() === String(user.email || '').toLowerCase()
    }
    return false
  })

  if (!match) {
    return { role: null, permissions: [] }
  }

  const role = match.role === 'editor' ? 'editor' : 'viewer'
  const permissions = Array.isArray(match.permissions) && match.permissions.length > 0
    ? match.permissions
    : [...ALL_TAB_KEYS]

  return { role, permissions }
}

export const ensureTripAccess = async (
  event: any,
  tripId: string | undefined,
  requiredRole: TripRole = 'viewer'
): Promise<TripAccessResult> => {
  const user = await requireAuth(event)

  if (!tripId) {
    throw createError({ statusCode: 400, message: '缺少旅程 ID' })
  }

  const docRef = firestore().collection('trips').doc(tripId)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw createError({ statusCode: 404, message: '找不到旅程' })
  }

  const data = docSnap.data() || {}
  const { role, permissions } = resolveTripRoleForUser(data, user)

  if (!role) {
    throw createError({ statusCode: 403, message: '沒有權限讀取此旅程' })
  }

  if (ROLE_PRIORITY[role] < ROLE_PRIORITY[requiredRole]) {
    throw createError({ statusCode: 403, message: '權限不足，無法完成操作' })
  }

  return {
    role,
    permissions,
    user,
    tripId: docSnap.id,
    tripData: data,
    docRef,
  }
}
