import { firestore } from '../../plugins/firebase-admin'
import { requireAuth } from '../../utils/auth'
import { resolveTripRoleForUser } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = firestore()

    const userEmailLower = user.email ? String(user.email).toLowerCase() : null

    const ownedPromise = db.collection('trips').where('userId', '==', user.uid).get()
    const collaboratorUidPromise = db
      .collection('trips')
      .where('collaboratorUids', 'array-contains', user.uid)
      .get()
    const collaboratorEmailPromise = userEmailLower
      ? db.collection('trips').where('collaboratorEmails', 'array-contains', userEmailLower).get()
      : Promise.resolve(null)

    const [ownedSnap, collabSnap, collabEmailSnap] = await Promise.all([
      ownedPromise,
      collaboratorUidPromise,
      collaboratorEmailPromise,
    ])

    const tripsMap = new Map<string, any>()

    ownedSnap.forEach((doc) => {
      const data = doc.data()
      tripsMap.set(doc.id, { id: doc.id, ...data, accessRole: 'owner', accessPermissions: ['itinerary', 'shopping', 'food', 'journal', 'ledger', 'luggage'] })
    })

    const pushTrip = (doc: any, role?: string) => {
      if (tripsMap.has(doc.id)) return
      const data = doc.data()
      const resolved = resolveTripRoleForUser(data, user)
      const resolvedRole = role || resolved.role || 'viewer'
      const resolvedPermissions = resolved.permissions || []
      tripsMap.set(doc.id, { id: doc.id, ...data, accessRole: resolvedRole, accessPermissions: resolvedPermissions })
    }

    collabSnap.forEach((doc) => pushTrip(doc))

    if (collabEmailSnap) {
      collabEmailSnap.forEach((doc) => pushTrip(doc))
    }

    const trips = Array.from(tripsMap.values()).sort((a: any, b: any) => {
      const aDate = a.createdAt || ''
      const bDate = b.createdAt || ''
      return bDate.localeCompare(aDate)
    })

    return trips
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})