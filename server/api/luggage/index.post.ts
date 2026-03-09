import { firestore } from '../../plugins/firebase-admin'
import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const isArray = Array.isArray(body)
    const tripId = isArray ? body[0]?.tripId : body.tripId
    const { user } = await ensureTripAccess(event, tripId, 'editor')

    if (isArray) {
      // Handle batch insert for default checklist
      const batch = firestore().batch()
      const result: any[] = []
      
      for (const item of body) {
        const docRef = firestore().collection('luggage').doc()
        const data = {
          ...item,
          tripId,
          userId: user.uid,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        batch.set(docRef, data)
        result.push({ id: docRef.id, ...data })
      }
      
      await batch.commit()
      return result
    } else {
      // Handle single insert
      const data = {
        ...body,
        tripId,
        userId: user.uid,
        isCompleted: body.isCompleted || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await firestore().collection('luggage').add(data)
      return { id: docRef.id, ...data }
    }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})
