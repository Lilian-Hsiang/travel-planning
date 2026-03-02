import { getAuth } from 'firebase/auth'
import { getApp, getApps } from 'firebase/app'

/**
 * 自動附帶 Firebase ID Token 的請求工具
 * 後端的 requireAuth 會解析此 Token 以識別使用者身分
 */
export const useAuthFetch = () => {
	const getToken = async (): Promise<string | null> => {
		if (!process.client) return null
		if (!getApps().length) return null
		try {
			const auth = getAuth(getApp())
			const currentUser = auth.currentUser
			if (!currentUser) return null
			return await currentUser.getIdToken()
		} catch {
			return null
		}
	}

	// 包裝 $fetch，自動在 Header 加入 Authorization: Bearer <token>
	const authFetch = async <T = any>(url: string, opts: any = {}): Promise<T> => {
		const token = await getToken()
		return $fetch<T>(url, {
			...opts,
			headers: {
				...opts.headers,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		})
	}

	return { authFetch }
}
