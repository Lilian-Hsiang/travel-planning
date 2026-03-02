<template>
  <div class="trip-page-wrapper">
    
    <!-- 全域 Header 與 Tab 選單 -->
    <header class="trip-global-header">
      <div class="header-top">
        <NuxtLink class="back-btn" to="/itinerary">← 返回我的旅程</NuxtLink>
        <h1 class="trip-title">{{ trip?.name || '載入中...' }}</h1>
      </div>
      
      <nav class="trip-tabs">
        <button :class="{ active: activeTab === 'itinerary' }" @click="activeTab = 'itinerary'">行程規劃</button>
        <button :class="{ active: activeTab === 'shopping' }" @click="activeTab = 'shopping'">購物清單</button>
        <button :class="{ active: activeTab === 'food' }" @click="activeTab = 'food'">美食清單</button>
        <button :class="{ active: activeTab === 'journal' }" @click="activeTab = 'journal'">旅遊手帳</button>
      </nav>
    </header>

    <!-- ==================== 1. 行程規劃 Tab ==================== -->
    <div v-if="activeTab === 'itinerary'" class="detail-layout">
      <!-- 左側/上方 日期選擇區 -->
      <aside class="days-sidebar">
        <div class="sidebar-header">
          <div class="header-title-row">
            <h2>行程天數</h2>
            <button @click="isDayModalOpen = true" class="add-day-btn">+ 新增天數</button>
          </div>
        </div>
        
        <div class="days-list">
          <div v-if="!trip?.days || trip.days.length === 0" class="no-days-msg">
            請先新增天數
          </div>
          <button v-for="d in (trip?.days || [])" :key="d.day" 
                  class="day-btn" :class="{ active: selectedDay === d.day }"
                  @click="selectedDay = d.day">
            <span class="day-num">Day {{ d.day }}</span>
            <span class="day-date">{{ d.date }}</span>
          </button>
        </div>
      </aside>

      <!-- 右側/下方 行程內容區 -->
      <main class="timeline-content">
        <div class="content-header">
          <h2>第 {{ selectedDay }} 天行程</h2>
          <button @click="openAddModal" class="add-item-btn" :disabled="!trip?.days?.length">
            + 新增單筆行程
          </button>
        </div>

        <div v-if="pending" class="empty-state">載入中...</div>
        <div v-else-if="filteredItineraries.length === 0" class="empty-state">
          這天還沒有行程喔！
        </div>

        <div v-else class="itinerary-list">
          <div v-for="item in filteredItineraries" :key="item.id" class="card">
            <div class="card-time">{{ item.time || '00:00' }}</div>
            <div class="card-body">
              <span class="category">{{ item.category || 'ATTRACTION' }}</span>
              <h3>{{ item.name }}</h3>
              <p>📍 {{ item.location }}</p>
            </div>
            <div class="card-actions">
              <button class="edit-btn" @click="openEdit(item)">編輯</button>
              <button @click="deleteItinerary(item.id)" class="delete-btn">刪除</button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== 2. 購物清單 Tab ==================== -->
    <div v-else-if="activeTab === 'shopping'" class="placeholder-layout">
      <div class="placeholder-content">
        <span class="icon">🛍️</span>
        <h2>購物清單</h2>
        <p>這裡將會顯示購物清單的內容 (開發中...)</p>
      </div>
    </div>

    <!-- ==================== 3. 美食清單 Tab ==================== -->
    <div v-else-if="activeTab === 'food'" class="placeholder-layout">
      <div class="placeholder-content">
        <span class="icon">🍔</span>
        <h2>美食清單</h2>
        <p>這裡將會顯示美食清單的內容 (開發中...)</p>
      </div>
    </div>

    <!-- ==================== 4. 旅遊手帳 Tab ==================== -->
    <div v-else-if="activeTab === 'journal'" class="placeholder-layout">
      <div class="placeholder-content">
        <span class="icon">📖</span>
        <h2>旅遊手帳</h2>
        <p>這裡將會顯示旅遊手帳的內容 (開發中...)</p>
      </div>
    </div>

    <!-- ==================== Modals ==================== -->
    <!-- 1. 新增天數 Modal -->
    <AppModal :is-open="isDayModalOpen" title="新增天數" @close="isDayModalOpen = false">
      <form @submit.prevent="submitDayForm" class="modal-form">
        <div class="form-group">
          <label>選擇日期</label>
          <input v-model="newDayDate" type="date" required />
        </div>
        <button type="submit" class="submit-btn">確認新增天數</button>
      </form>
    </AppModal>

    <!-- 2. 新增單筆行程 Modal -->
    <AppModal :is-open="isModalOpen" :title="isEditing ? '編輯行程' : '新增行程'" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-group">
          <label>時間</label>
          <input v-model="form.time" type="time" required />
        </div>
        <div class="form-group">
          <label>分類</label>
          <select v-model="form.category">
            <option value="TRANSPORT">交通</option>
            <option value="FOOD">美食</option>
            <option value="ATTRACTION">景點</option>
          </select>
        </div>
        <div class="form-group">
          <label>行程名稱</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>地點</label>
          <input v-model="form.location" type="text" required />
        </div>
        <button type="submit" class="submit-btn">確認儲存行程</button>
      </form>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = route.params.id

const { authFetch } = useAuthFetch()

// --- Tab 狀態管理 ---
const activeTab = ref('itinerary') // 預設顯示「行程規劃」

// 1. 取得該旅程的詳細資訊
const { data: trip, refresh: refreshTrip } = await useAsyncData(
  `trip-${tripId}`,
  () => authFetch(`/api/trips/${tripId}`),
  { server: false }
)

// 2. 取得該旅程的所有行程
const { data: itineraries, pending, refresh } = await useAsyncData(
  `itineraries-${tripId}`,
  () => authFetch(`/api/itinerary?tripId=${tripId}`),
  { server: false }
)

const selectedDay = ref(1)

// 篩選出符合「目前選中天數」的行程
const filteredItineraries = computed(() => {
  if (!itineraries.value) return []
  return itineraries.value
    .filter(item => item.day === selectedDay.value)
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
})

// --- 新增天數邏輯 ---
const isDayModalOpen = ref(false)
const newDayDate = ref('')

const submitDayForm = async () => {
  try {
    const currentDays = trip.value?.days || []
    const nextDayNum = currentDays.length + 1
    const updatedDays = [...currentDays, { day: nextDayNum, date: newDayDate.value }]

    await authFetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      body: { days: updatedDays }
    })
    
    isDayModalOpen.value = false
    newDayDate.value = ''
    await refreshTrip()
    selectedDay.value = nextDayNum
  } catch (error) {
    alert('新增天數失敗')
  }
}

// --- 新增單筆行程邏輯 ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ time: '10:00', category: 'ATTRACTION', name: '', location: '', day: 1 })

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { time: '10:00', category: 'ATTRACTION', name: '', location: '', day: selectedDay.value }
  isModalOpen.value = true
}

const openEdit = (item) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    time: item.time || '10:00',
    category: item.category || 'ATTRACTION',
    name: item.name || '',
    location: item.location || '',
    day: item.day || selectedDay.value
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  isEditing.value = false
  editingId.value = null
}

const submitForm = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await authFetch(`/api/itinerary/${editingId.value}`, {
        method: 'PUT',
        body: { ...form.value }
      })
    } else {
      await authFetch('/api/itinerary', { 
        method: 'POST', 
        body: { ...form.value, tripId } 
      })
    }
    closeModal()
    await refresh()
  } catch (error) {
    alert('儲存失敗')
  }
}

const deleteItinerary = async (id) => {
  if (!confirm('確定刪除？')) return
  await authFetch(`/api/itinerary/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<style lang="scss" scoped>
.trip-page-wrapper {
  min-height: 100vh;
  background: #F7F7F9;
  font-family: sans-serif;
}

/* 全域 Header 與 Tabs */
.trip-global-header {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 30;
  
  .header-top {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 1.5rem 0.5rem;
    
    .back-btn {
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      display: inline-block;
      margin-bottom: 0.5rem;
      transition: color 0.2s;
      &:hover { color: #5A4CFA; }
    }
    
    .trip-title {
      margin: 0;
      font-size: 1.75rem;
      color: #1f2937;
      font-weight: bold;
    }
  }

  .trip-tabs {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    gap: 1.5rem;
    padding: 0 1.5rem;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar { display: none; } /* Chrome */

    button {
      background: none;
      border: none;
      padding: 1rem 0;
      font-size: 1rem;
      font-weight: bold;
      color: #9ca3af;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover { color: #4b5563; }
      
      &.active {
        color: #5A4CFA;
        border-bottom-color: #5A4CFA;
      }
    }
  }
}

/* 行程規劃佈局 */
.detail-layout {
  display: flex;
  flex-direction: column;
  
  @media (min-width: 768px) {
    flex-direction: row;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    gap: 2rem;
  }
}

/* 左側/上方 日期選擇區 */
.days-sidebar {
  background: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  
  @media (min-width: 768px) {
    width: 280px;
    border-radius: 1rem;
    height: fit-content;
    position: sticky;
    top: 10rem; /* 避開 Header */
  }

  .sidebar-header {
    margin-bottom: 1rem;
    .header-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h2 { margin: 0; font-size: 1.25rem; color: #1f2937; }
      .add-day-btn {
        background: #e0e7ff; color: #4f46e5; border: none; padding: 0.35rem 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: bold; transition: background 0.2s;
        &:hover { background: #c7d2fe; }
      }
    }
  }

  .days-list {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    
    @media (min-width: 768px) {
      flex-direction: column;
      overflow-x: visible;
    }
  }

  .no-days-msg { font-size: 0.875rem; color: #9ca3af; padding: 1rem 0; }

  .day-btn {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    
    &.active {
      background: #5A4CFA;
      border-color: #5A4CFA;
      color: white;
      .day-num, .day-date { color: white; }
    }
    
    .day-num { font-weight: bold; font-size: 1rem; color: #374151; }
    .day-date { font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
  }
}

/* 右側/下方 行程內容區 */
.timeline-content {
  flex: 1;
  padding: 1.5rem;

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h2 { margin: 0; font-size: 1.5rem; color: #1f2937; }
    .add-item-btn {
      background: #5A4CFA; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;
      &:disabled { background: #d1d5db; cursor: not-allowed; }
    }
  }
}

/* 行程卡片 */
.itinerary-list { display: flex; flex-direction: column; gap: 1rem; }

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  
  .card-time { font-weight: bold; color: #5A4CFA; width: 3rem; }
  .card-body {
    flex: 1 1 60%;
    .category { font-size: 0.75rem; background: #e0e7ff; color: #4f46e5; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; }
    h3 { margin: 0.5rem 0 0.25rem 0; font-size: 1.125rem; }
    p { margin: 0; color: #6b7280; font-size: 0.875rem; }
  }
  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .edit-btn,
  .delete-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }
  .edit-btn {
    background: #e0f2fe;
    color: #0369a1;
  }
  .delete-btn {
    background: #fee2e2;
    color: #ef4444;
  }
}

.empty-state { text-align: center; padding: 3rem; color: #9ca3af; background: white; border-radius: 1rem; border: 1px dashed #d1d5db; }

/* 其他 Tab 的佔位區塊樣式 */
.placeholder-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  
  .placeholder-content {
    background: white;
    border-radius: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    
    .icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
    h2 { font-size: 1.5rem; color: #1f2937; margin-bottom: 0.5rem; }
    p { color: #6b7280; }
  }
}

/* Modal 表單共用樣式 */
.modal-form {
  display: flex; flex-direction: column; gap: 1rem;
  .form-group {
    display: flex; flex-direction: column; gap: 0.5rem;
    label { font-size: 0.875rem; font-weight: bold; color: #374151; }
    input, select { padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; }
    input:focus, select:focus { border-color: #5A4CFA; }
  }
  .submit-btn { background: #5A4CFA; color: white; padding: 1rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
}
</style>