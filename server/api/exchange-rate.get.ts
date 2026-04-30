let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export default defineEventHandler(async () => {
  const now = Date.now()

  if (cachedRates && now - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates
  }

  try {
    const response = await $fetch<{ rates: Record<string, number> }>(
      'https://api.exchangerate-api.com/v4/latest/TWD'
    )

    // Convert: the API gives rates relative to TWD=1
    // We want: 1 unit of X = ? TWD, so we invert
    const ratesInTWD: Record<string, number> = {}
    for (const [currency, rate] of Object.entries(response.rates)) {
      ratesInTWD[currency] = rate > 0 ? 1 / rate : 0
    }
    ratesInTWD['TWD'] = 1

    cachedRates = { rates: ratesInTWD, timestamp: now }
    return ratesInTWD
  } catch (error: any) {
    // If we have stale cache, return it
    if (cachedRates) {
      return cachedRates.rates
    }
    throw createError({ statusCode: 502, message: '無法取得匯率資料' })
  }
})
