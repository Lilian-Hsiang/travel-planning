<template>
  <div class="home-container">
    <!-- 導覽列 -->
    <header class="header">
      <div class="logo">✈️ Travel Planner</div>
      
      <div class="auth-section">
        <template v-if="!loading">
          <!-- 已登入狀態 -->
          <div v-if="user" class="user-profile">
            <img 
              v-if="user.photoURL" 
              :src="user.photoURL" 
              alt="avatar" 
              class="avatar" 
            />
            <div v-else class="avatar-placeholder">
              {{ user.displayName ? user.displayName[0] : 'U' }}
            </div>
            <span class="user-name">{{ user.displayName || '旅人' }}</span>
            <button @click="handleSignOut" class="btn-logout">登出</button>
          </div>
          
          <!-- 未登入狀態 -->
          <div v-else class="login-buttons">
            <button @click="loginWithGoogle" class="btn-login google">
              <span class="icon">G</span> Google 登入
            </button>
            <button @click="loginWithLine" class="btn-login line">
              <span class="icon">L</span> LINE 登入
            </button>
          </div>
        </template>
        <span v-else class="loading-text">載入中...</span>
      </div>
    </header>

    <!-- 主要內容區 -->
    <main class="hero">
      <h1>規劃你的下一趟完美旅程</h1>
      <p>集中管理行程、預算與靈感，與旅伴即時協作。</p>
      
      <div class="cta-container">
        <button v-if="user" type="button" class="btn-primary" @click="goItinerary">
          前往我的旅程
        </button>
        <div v-else class="cta-login-hint">
          請先登入以開始規劃你的專屬旅程
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>

// 引入我們剛剛建立的 composable
const { user, loading, loginWithGoogle, loginWithLine, handleSignOut } = useAuth()
const router = useRouter()

const goItinerary = () => {
  // 先嘗試 Nuxt 路由，若有問題則改用硬導向
  router.push('/itinerary').catch(() => {
    window.location.href = '/itinerary'
  })
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f9fafb;
  font-family: sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.auth-section {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #5A4CFA;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.btn-logout {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #f3f4f6;
}

.login-buttons {
  display: flex;
  gap: 1rem;
}

.btn-login {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  color: white;
  transition: opacity 0.2s;
}

.btn-login:hover {
  opacity: 0.9;
}

.btn-login.google {
  background-color: #ea4335;
}

.btn-login.line {
  background-color: #00b900;
}

.icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.loading-text {
  color: #6b7280;
}

.hero {
  max-width: 800px;
  margin: 4rem auto;
  text-align: center;
  padding: 0 2rem;
}

.hero h1 {
  font-size: 3rem;
  color: #111827;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  color: #4b5563;
  margin-bottom: 2.5rem;
}

.cta-container {
  margin-top: 2rem;
}

.btn-primary {
  display: inline-block;
  background-color: #5A4CFA;
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-primary:hover {
  background-color: #4f46e5;
}

.cta-login-hint {
  color: #6b7280;
  font-size: 1.1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  display: inline-block;
}
</style>
