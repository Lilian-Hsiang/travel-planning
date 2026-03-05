import { ensureTripAccess } from '../../utils/tripAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

    const { tripData, tripId, role } = await ensureTripAccess(event, id, 'viewer')

    return { id: tripId, ...tripData, accessRole: role }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message })
  }
})