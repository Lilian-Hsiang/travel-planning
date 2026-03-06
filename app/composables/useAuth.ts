import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	OAuthProvider,
	signOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth'
import { getApp, getApps, initializeApp } from 'firebase/app'

export const useAuth = () => {
	// 使用 useState 確保狀態在 Nuxt 應用中是響應式且全域的
	const user = useState<User | null>('firebase-user', () => null)
	const loading = useState<boolean>('firebase-auth-loading', () => true)
	const { push: pushToast } = useToast()
	const toastKey = 'login-toast-message'

	// 確保取得 Firebase App 實例的輔助函式
	const getFirebaseApp = () => {
		if (getApps().length > 0) {
			return getApp()
		}
		const config = useRuntimeConfig().public.firebase
		return initializeApp(config)
	}

	// 確保只在客戶端初始化監聽器
	if (process.client) {
		setTimeout(() => {
			try {
				const app = getFirebaseApp()
				const auth = getAuth(app)
				onAuthStateChanged(auth, (currentUser) => {
					user.value = currentUser
					loading.value = false

					// redirect 回來後再顯示歡迎訊息
					if (process.client && currentUser) {
						const pendingMessage = sessionStorage.getItem(toastKey)
						if (pendingMessage) {
							pushToast(pendingMessage, 'success')
							sessionStorage.removeItem(toastKey)
						}

					}
				})
			} catch (error) {
				console.error('Firebase Auth 初始化失敗:', error)
				loading.value = false
			}
		}, 0)
	}

	// Google 登入
	const loginWithGoogle = async () => {
		try {
			const app = getFirebaseApp()
			const auth = getAuth(app)
			const provider = new GoogleAuthProvider()
			provider.setCustomParameters({ prompt: 'select_account' })
			const result = await signInWithPopup(auth, provider)
			// 立即同步登入狀態，避免需手動刷新才看到
			user.value = result.user
			loading.value = false
			// 將歡迎訊息暫存，待 redirect 返回後再顯示
			const name = result.user?.displayName || result.user?.email || '旅人'
			if (process.client) {
				sessionStorage.setItem(toastKey, `哈囉! ${name}，請開啟你的旅程吧!`)
				window.location.href = '/'
			}
		} catch (error) {
			console.error('Google 登入失敗:', error)
			throw error
		}
	}

	// LINE 登入 (透過 Firebase OIDC)
	const loginWithLine = async () => {
		try {
			const app = getFirebaseApp()
			const auth = getAuth(app)
			const provider = new OAuthProvider('oidc.line')
			const result = await signInWithPopup(auth, provider)
			user.value = result.user
			loading.value = false
			const name = result.user?.displayName || result.user?.email || '旅人'
			if (process.client) {
				sessionStorage.setItem(toastKey, `哈囉! ${name}，請開啟你的旅程吧!`)
				window.location.href = '/'
			}
		} catch (error) {
			console.error('LINE 登入失敗:', error)
			throw error
		}
	}

	// 登出
	const handleSignOut = async () => {
		try {
			const app = getFirebaseApp()
			const auth = getAuth(app)
			await signOut(auth)
		} catch (error) {
			console.error('登出失敗:', error)
			throw error
		}
	}

	return {
		user,
		loading,
		loginWithGoogle,
		loginWithLine,
		handleSignOut
	}
}
