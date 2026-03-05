<template>
  <div class="trip-page-wrapper">
    
    <!-- 全域 Header 與 Tab 選單 -->
    <header class="trip-global-header">
      <div class="header-top">
        <NuxtLink class="back-btn" to="/itinerary">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" class="back-icon" aria-hidden="true" />
          返回我的旅程
        </NuxtLink>
        <h1 class="trip-title">{{ trip?.name || '載入中...' }}</h1>
      </div>
      
      <nav class="trip-tabs">
        <button :class="{ active: activeTab === 'itinerary' }" @click="activeTab = 'itinerary'">行程規劃</button>
        <button :class="{ active: activeTab === 'shopping' }" @click="activeTab = 'shopping'">購物清單</button>
        <button :class="{ active: activeTab === 'food' }" @click="activeTab = 'food'">美食清單</button>
        <button :class="{ active: activeTab === 'journal' }" @click="activeTab = 'journal'">旅遊手帳</button>
        <button :class="{ active: activeTab === 'ledger' }" @click="activeTab = 'ledger'">記帳分帳</button>
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
            + 新增行程
          </button>
        </div>

        <div v-if="pending" class="empty-state">載入中...</div>
        <div v-else-if="filteredItineraries.length === 0" class="empty-state">
          這天還沒有行程喔！
        </div>

        <div v-else class="itinerary-list">
          <template v-for="(item, index) in filteredItineraries" :key="item.id">
            
            <!-- 行程間的交通時間/距離 (從第二筆開始顯示) -->
            <div v-if="index > 0" class="transit-connector">
              <div class="connector-line"></div>
              <a 
                :href="getDirectionsUrl(filteredItineraries[index-1].location, item.location)" 
                target="_blank" 
                class="transit-link"
                title="點擊導航"
              >
               <FontAwesomeIcon :icon="['fas', 'route']" class="inline-icon" />
                開啟路線導航
              </a>
            </div>

            <div class="card">
              <div class="card-time">{{ item.time || '00:00' }}</div>
              <div class="card-body">
                <span class="category">{{ item.category || 'ATTRACTION' }}</span>
                <h3>{{ item.name }}</h3>
                <p class="location-row">
                  <!-- <FontAwesomeIcon :icon="['fas', 'location-dot']" class="" aria-hidden="true" /> -->
                  📍 <a :href="getMapUrl(item.location)" target="_blank" class="location-link">
                    {{ item.location }}
                  </a>
                </p>
                <p v-if="item.notes" class="notes">
                  <FontAwesomeIcon :icon="['far', 'clipboard']" class="inline-icon" aria-hidden="true" />
                  {{ item.notes }}
                </p>
              </div>
              <div class="card-actions">
                <button class="edit-btn" @click="openEdit(item)"><FontAwesomeIcon :icon="['fas', 'pen-to-square']" aria-hidden="true" /></button>
                <button @click="openDeleteConfirm(item)" class="delete-btn"><FontAwesomeIcon :icon="['fas', 'trash']" aria-hidden="true" /></button>
              </div>
            </div>
          </template>
        </div>
      </main>
    </div>

    <!-- ==================== 2. 購物清單 Tab ==================== -->
    <div v-else-if="activeTab === 'shopping'">
      <PlaceListTab list-type="shopping" :trip-id="tripId as string" />
    </div>

    <!-- ==================== 3. 美食清單 Tab ==================== -->
    <div v-else-if="activeTab === 'food'">
      <PlaceListTab list-type="food" :trip-id="tripId as string" />
    </div>

    <!-- ==================== 4. 旅遊手帳 Tab ==================== -->
    <div v-else-if="activeTab === 'journal'">
      <JournalTab :trip-id="tripId as string" />
    </div>

    <!-- ==================== 5. 記帳 / 分帳 Tab ==================== -->
    <div v-else-if="activeTab === 'ledger'">
      <LedgerTab :trip-id="tripId as string" />
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
        <div class="form-group">
          <label>備註</label>
          <textarea v-model="form.notes" rows="3" placeholder="例如：記得帶雨傘、門票預約代碼..."></textarea>
        </div>
        <button type="submit" class="submit-btn">確認儲存行程</button>
      </form>
    </AppModal>

    <!-- 3. 刪除確認 Modal -->
    <AppModal :is-open="isDeleteModalOpen" title="刪除確認" @close="closeDeleteModal">
      <div class="delete-confirm-content">
        <p>確定要刪除「<strong>{{ deletingItem?.name }}</strong>」這個行程嗎？</p>
        <p class="warning-text">此動作無法還原。</p>
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="cancel-btn">取消</button>
          <button @click="confirmDelete" class="submit-btn delete-btn">確定刪除</button>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tripId = route.params.id

const { authFetch } = useAuthFetch()
const { user } = useAuth()

// --- Tab 狀態管理 ---
const activeTab = ref('itinerary') // 預設顯示「行程規劃」

// 1. 取得該旅程的詳細資訊
const { data: trip, refresh: refreshTrip, pending: tripPending } = await useAsyncData(
  `trip-${tripId}`,
  () => authFetch(`/api/trips/${tripId}`),
  { 
    server: false,
    immediate: false,
    watch: [user]
  }
)

// 2. 取得該旅程的所有行程
const { data: itineraries, pending, refresh } = await useAsyncData(
  `itineraries-${tripId}`,
  () => authFetch(`/api/itinerary?tripId=${tripId}`),
  { 
    server: false,
    immediate: false,
    watch: [user] 
  }
)

if (user.value) {
  refreshTrip()
  refresh()
}

const selectedDay = ref(1)

// 篩選出符合「目前選中天數」的行程
const filteredItineraries = computed(() => {
  if (!itineraries.value) return []
  return itineraries.value
    .filter(item => item.day === selectedDay.value)
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
})

// --- Google Maps 連結產生器 ---
const getMapUrl = (location: string) => {
  if (!location) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

const getDirectionsUrl = (origin: string, destination: string) => {
  if (!origin || !destination) return '#'
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}

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
const form = ref({ time: '10:00', category: 'ATTRACTION', name: '', location: '', notes: '', day: 1 })

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { time: '10:00', category: 'ATTRACTION', name: '', location: '', notes: '', day: selectedDay.value }
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
    notes: item.notes || '',
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

// --- 刪除行程邏輯 ---
const isDeleteModalOpen = ref(false)
const deletingItem = ref<any>(null)

const openDeleteConfirm = (item: any) => {
  deletingItem.value = item
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  deletingItem.value = null
}

const confirmDelete = async () => {
  if (!deletingItem.value) return
  
  try {
    await authFetch(`/api/itinerary/${deletingItem.value.id}`, { method: 'DELETE' })
    closeDeleteModal()
    await refresh()
  } catch (err) {
    alert('刪除失敗')
  }
}

</script>

<style lang="scss" scoped>
.trip-page-wrapper {
  min-height: 100vh;
  background: #fff5e3;
  font-family: sans-serif;
}

/* 全域 Header 與 Tabs */
.trip-global-header {
  background: #FFD283;
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
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
      transition: color 0.2s;
      &:hover { color: #413524; }
    }

    .back-icon {
      font-size: 0.9rem;
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
      color: #7e7a67;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;

      &:hover { color: #635f4b; }
      
      &.active {
        color: #f3731e;
        border-bottom-color: #FEA365;
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
  background: #9FAF64;
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
        background: #fff5e3; color: #ff8d41; border: none; padding: 0.35rem 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: bold; transition: background 0.2s;
        &:hover { background: #ffe6bb; }
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

  .no-days-msg { font-size: 0.875rem; color: #ffffff; padding: 1rem 0; }

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
      background: #FFD283;
      border-color: #FFD283;
      color: #374151;
      .day-num, .day-date { color: #374151; }
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
      background: #fa8a3e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;
      &:disabled { background: #d1d5db; cursor: not-allowed; }
    }
  }
}

/* 行程卡片 */
.itinerary-list { display: flex; flex-direction: column; gap: 1rem; }

/* 景點連結 */
.location-link {
  color: #9FAF64;
  font-weight: bold;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.location-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;

  .inline-icon {
    color: #9FAF64;
    font-size: 0.9rem;
  }
}

.inline-icon {
  // color: #9FAF64;
  font-size: 0.9rem;
  margin-right: 0.25rem;
}

/* 交通連接線 */
.transit-connector {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
  margin: -0.25rem 0; /* 讓它跟兩邊卡片靠近一點 */
  
  .connector-line {
    width: 3rem; /* 對齊卡片的時間寬度 */
    height: 100%;
    min-height: 2.5rem;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: #9FAF64;
      transform: translateX(-50%);
    }
  }
  
  .transit-link {
    font-size: 0.875rem;
    color: white;
    text-decoration: none;
    background: #9FAF64;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    
    &:hover {
      background: #FFD283;
      color: #374151;
    }

    .transit-note {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-left: 0.5rem;
    }
  }
}

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  
  .card-time { font-weight: bold; color: #FEA365; width: 3rem; }
  .card-body {
    flex: 1 1 60%;
    .category { font-size: 0.75rem; background: #FFD283; color: #514137; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; }
    h3 { margin: 0.5rem 0 0.25rem 0; font-size: 1.125rem; }
    p { margin: 0; color: #6b7280; font-size: 0.875rem; }
    .notes {
      color: #6b7280;
      font-size: 0.8125rem;
      margin: 0.25rem 0 0;
      white-space: pre-line;
    }
  }
  .card-actions {
    display: flex;
    // flex-direction: column;
    gap: 0.5rem;
  }
  .edit-btn,
  .delete-btn {
    padding: 0.5rem 0.5rem;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }
  .edit-btn {
    background: #9FAF64;
    color: white;
  }
  .delete-btn {
    background: #ff8d41;
    color: white;
  }
}

/* 刪除確認 Modal 樣式 */
.delete-confirm-content {
  padding: 1rem 0;
  text-align: center;
  p { margin-bottom: 0.5rem; color: #374151; }
  .warning-text { color: #dc2626; font-size: 0.875rem; margin-bottom: 1.5rem; }
  
  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    
    .cancel-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: bold;
      color: #374151;
      &:hover { background: #f3f4f6; }
    }
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
    input:focus, select:focus { border-color: #FEA365; }
  }
  .submit-btn { background: #FEA365; color: white; padding: 1rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
}
</style>