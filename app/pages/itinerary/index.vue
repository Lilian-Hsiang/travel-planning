<template>
  <div class="trips-container">
    <header class="page-header">
      <h1>我的旅程</h1>
      <button @click="isModalOpen = true" class="add-btn">+ 新增旅程</button>
    </header>

    <div v-if="pending" class="loading">載入中...</div>
    
    <div class="trips-grid">
      <NuxtLink v-for="trip in trips" :key="trip.id" :to="`/itinerary/${trip.id}`" class="trip-card">
        
        <!-- 刪除按鈕 (使用 .prevent 避免點擊時觸發 NuxtLink 的跳轉) -->
        <button @click.prevent="openDeleteModal(trip.id)" class="delete-trip-btn" title="刪除旅程">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="card-cover">✈️</div>
        <div class="card-info">
          <h2>{{ trip.name }}</h2>
          <p>{{ trip.startDate }} ~ {{ trip.endDate }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- 新增旅程的 Modal -->
    <AppModal :is-open="isModalOpen" title="新增旅程" @close="isModalOpen = false">
      <form @submit.prevent="createTrip" class="modal-form">
        <div class="form-group">
          <label>旅程名稱 (例如：曼谷五天四夜)</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>開始日期</label>
            <input v-model="form.startDate" type="date" required />
          </div>
          <div class="form-group">
            <label>結束日期</label>
            <input v-model="form.endDate" type="date" required />
          </div>
        </div>
        <button type="submit" class="submit-btn" :disabled="isSubmitting">確認新增</button>
      </form>
    </AppModal>

    <!-- 刪除確認的 Modal -->
    <AppModal :is-open="isDeleteModalOpen" title="刪除旅程" @close="isDeleteModalOpen = false">
      <div class="delete-confirm-content">
        <p>確定要刪除這個旅程嗎？（此動作無法復原）</p>
        <div class="modal-actions">
          <button @click="isDeleteModalOpen = false" class="cancel-btn">取消</button>
          <button @click="executeDeleteTrip" class="confirm-delete-btn" :disabled="isDeleting">
            {{ isDeleting ? '刪除中...' : '確定刪除' }}
          </button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const { authFetch } = useAuthFetch()

// server: false 讓資料只在客戶端提取，避免 SSR 時沒有 token
const { data: trips, pending, refresh } = await useAsyncData(
  'trips',
  () => authFetch('/api/trips'),
  { server: false }
)

// --- 新增旅程邏輯 ---
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const form = ref({ name: '', startDate: '', endDate: '' })

const createTrip = async () => {
  isSubmitting.value = true
  try {
    await authFetch('/api/trips', { method: 'POST', body: form.value })
    isModalOpen.value = false
    form.value = { name: '', startDate: '', endDate: '' }
    await refresh()
  } catch (error) {
    alert('新增失敗')
  } finally {
    isSubmitting.value = false
  }
}

// --- 刪除旅程邏輯 ---
const isDeleteModalOpen = ref(false)
const tripToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (id) => {
  tripToDelete.value = id
  isDeleteModalOpen.value = true
}

const executeDeleteTrip = async () => {
  if (!tripToDelete.value) return
  
  isDeleting.value = true
  try {
    await authFetch(`/api/trips/${tripToDelete.value}`, { method: 'DELETE' })
    isDeleteModalOpen.value = false
    tripToDelete.value = null
    await refresh()
  } catch (error) {
    alert('刪除失敗')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.trips-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 { font-size: 1.75rem; color: #1f2937; margin: 0; }
  
  .add-btn {
    background: #5A4CFA;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #4f46e5; }
  }
}

.trips-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
}

.trip-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  position: relative;
  
  .delete-trip-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
      background: #ef4444;
      color: white;
    }

    svg { width: 1.25rem; height: 1.25rem; }
  }

  &:hover { 
    transform: translateY(-4px); 
    .delete-trip-btn { opacity: 1; }
  }
  
  .card-cover {
    height: 120px;
    background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
  }
  
  .card-info {
    padding: 1.25rem;
    h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #1f2937; }
    p { margin: 0; color: #6b7280; font-size: 0.875rem; }
  }
}

/* Modal 表單共用樣式 */
.modal-form {
  display: flex; flex-direction: column; gap: 1rem;
  .form-row { display: flex; gap: 1rem; }
  .form-group {
    flex: 1; display: flex; flex-direction: column; gap: 0.5rem;
    label { font-size: 0.875rem; font-weight: bold; color: #374151; }
    input { padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
    input:focus { border-color: #5A4CFA; }
  }
  .submit-btn {
    background: #5A4CFA; color: white; padding: 1rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer;
  }
}

/* 刪除確認 Modal 的樣式 */
.delete-confirm-content {
  p { margin: 0 0 1.5rem 0; color: #374151; font-size: 1rem; }
}

.modal-actions {
  display: flex; gap: 1rem;
  button {
    flex: 1; padding: 0.875rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: background 0.2s;
  }
  .cancel-btn {
    background: #f3f4f6; color: #4b5563;
    &:hover { background: #e5e7eb; }
  }
  .confirm-delete-btn {
    background: #ef4444; color: white;
    &:hover:not(:disabled) { background: #dc2626; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}
</style>