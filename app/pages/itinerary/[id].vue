<template>
  <div class="trip-page-wrapper">
    
    <!-- 全域 Header 與 Tab 選單 -->
    <header class="trip-global-header">
      <div class="header-top">
        <NuxtLink class="back-btn" to="/itinerary">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" class="back-icon" aria-hidden="true" />
          返回我的旅程
        </NuxtLink>
        <h1 class="trip-title">{{ trip?.name || '載入中...' }}<img src="/pudding3.png" width="30" height="30" style="padding-left: 0.5rem; padding-top: 0.2rem;" /></h1>
      </div>
      
      <nav class="trip-tabs">
        <button :class="{ active: activeTab === 'itinerary' }" @click="switchTab('itinerary')">行程規劃</button>
        <button :class="{ active: activeTab === 'shopping' }" @click="switchTab('shopping')">購物清單</button>
        <button :class="{ active: activeTab === 'food' }" @click="switchTab('food')">美食清單</button>
        <button :class="{ active: activeTab === 'journal' }" @click="switchTab('journal')">旅遊手帳</button>
        <button :class="{ active: activeTab === 'ledger' }" @click="switchTab('ledger')">記帳分帳</button>
        <button :class="{ active: activeTab === 'luggage' }" @click="switchTab('luggage')">行李清單</button>
      </nav>
    </header>

    <!-- ==================== 1. 行程規劃 Tab ==================== -->
    <div v-if="activeTab === 'itinerary'" class="detail-layout">
      <!-- 左側/上方 日期選擇區 -->
      <aside class="days-sidebar">
        <div class="sidebar-header">
          <div class="header-title-row">
            <h2>行程天數</h2>
            <button v-if="canEditItinerary" @click="isDayModalOpen = true" class="add-day-btn">+ 新增天數</button>
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
          <button v-if="canEditItinerary" @click="openAddModal" class="add-item-btn" :disabled="!trip?.days?.length">
            + 新增行程
          </button>
        </div>

        <div v-if="pending" class="empty-state">載入中...</div>
        <div v-else-if="filteredItineraries.length === 0" class="empty-state">
          這天還沒有行程喔！
        </div>

        <draggable
          v-else
          v-model="draggableItineraries"
          item-key="id"
          handle=".drag-handle"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          @end="onDragEnd"
          class="itinerary-list"
        >
          <template #item="{ element, index }">
            <div class="draggable-item">
              <!-- 行程間的交通時間/距離 (從第二筆開始顯示) -->
              <div v-if="index > 0" class="transit-connector">
                <div class="connector-line"></div>
                <a 
                  :href="getDirectionsUrl(draggableItineraries[index-1].location, element.location)" 
                  target="_blank" 
                  class="transit-link"
                  title="點擊導航"
                >
                 <FontAwesomeIcon :icon="['fas', 'route']" class="inline-icon" />
                  開啟路線導航
                </a>
              </div>

              <div class="card">
                <div v-if="canEditItinerary" class="drag-handle" title="拖曳排序">
                  <FontAwesomeIcon :icon="['fas', 'grip-vertical']" />
                </div>
                <div class="card-time">{{ element.time || '00:00' }}</div>
                <div class="card-body">
                  <span class="category">{{ element.category || 'ATTRACTION' }}</span>
                  <h3>{{ element.name }}</h3>
                  <p v-if="element.location" class="location-row">
                    📍 <a :href="getMapUrl(element.location)" target="_blank" class="location-link">
                      {{ element.location }}
                    </a>
                  </p>
                  <p v-if="element.notes" class="notes">
                    <FontAwesomeIcon :icon="['far', 'clipboard']" class="inline-icon" aria-hidden="true" />
                    <template v-for="(segment, segmentIndex) in linkifyNotes(element.notes)" :key="segmentIndex">
                      <a
                        v-if="segment.href"
                        :href="segment.href"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="notes-link"
                      >{{ segment.text }}</a>
                      <template v-else>{{ segment.text }}</template>
                    </template>
                  </p>
                </div>
                <div v-if="canEditItinerary" class="card-actions">
                  <button class="edit-btn" @click="openEdit(element)"><FontAwesomeIcon :icon="['fas', 'pen-to-square']" aria-hidden="true" /></button>
                  <button @click="openDeleteConfirm(element)" class="delete-btn"><FontAwesomeIcon :icon="['fas', 'trash']" aria-hidden="true" /></button>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </main>
    </div>

    <!-- ==================== 2. 購物清單 Tab ==================== -->
    <div v-else-if="activeTab === 'shopping'">
      <PlaceListTab
        list-type="shopping"
        :trip-id="tripId as string"
        :access-role="tabAccessRole('shopping')"
      />
    </div>

    <!-- ==================== 3. 美食清單 Tab ==================== -->
    <div v-else-if="activeTab === 'food'">
      <PlaceListTab
        list-type="food"
        :trip-id="tripId as string"
        :access-role="tabAccessRole('food')"
      />
    </div>

    <!-- ==================== 4. 旅遊手帳 Tab ==================== -->
    <div v-else-if="activeTab === 'journal'">
      <JournalTab
        :trip-id="tripId as string"
        :access-role="tabAccessRole('journal')"
      />
    </div>

    <!-- ==================== 5. 記帳 / 分帳 Tab ==================== -->
    <div v-else-if="activeTab === 'ledger'">
      <LedgerTab :trip-id="tripId as string" />
    </div>

    <!-- ==================== 6. 行李清單 Tab ==================== -->
    <div v-else-if="activeTab === 'luggage'">
      <PackingListTab
        :trip-id="tripId as string"
        :access-role="tabAccessRole('luggage')"
      />
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
          <input v-model="form.location" type="text" />
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
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'

const route = useRoute()
const tripId = route.params.id

const { authFetch } = useAuthFetch()
const { user } = useAuth()
const { push: pushToast } = useToast()

// --- Tab 狀態管理 ---
const activeTab = ref('itinerary') // 預設顯示「行程規劃」

// 切換 Tab 時，如果沒有編輯權限則顯示提醒
const switchTab = (tabKey: string) => {
  activeTab.value = tabKey
  const role = tabAccessRole(tabKey)
  if (role !== 'owner' && role !== 'editor') {
    pushToast('你沒有權限編輯噢！', 'error')
  }
}

// 每個 Tab 的實際權限（依據協作者的 permissions 欄位）
const tabAccessRole = (tabKey: string): 'owner' | 'editor' | 'viewer' => {
  const role = trip.value?.accessRole
  if (!role) return 'viewer'
  if (role === 'owner') return 'owner'

  const perms: string[] | undefined = trip.value?.accessPermissions
  // 如果沒有設定 permissions 或為空，向下相容：沿用基礎角色
  if (!perms || perms.length === 0) return role
  // 有 permissions 且包含此 tab → 使用基礎角色，否則降為 viewer
  return perms.includes(tabKey) ? role : 'viewer'
}

// 行程規劃 Tab 是否可編輯
const canEditItinerary = computed(() => {
  const role = tabAccessRole('itinerary')
  return role === 'owner' || role === 'editor'
})

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

// 如果旅程有 startDate/endDate 但 days 為空，自動補上
const autoGenerateDays = async () => {
  if (!trip.value) return
  if (trip.value.days && trip.value.days.length > 0) return
  if (!trip.value.startDate || !trip.value.endDate) return

  const days = []
  const start = new Date(trip.value.startDate)
  const end = new Date(trip.value.endDate)
  let current = new Date(start)
  let dayNum = 1
  while (current <= end) {
    days.push({ day: dayNum, date: current.toISOString().split('T')[0] })
    dayNum++
    current.setDate(current.getDate() + 1)
  }

  if (days.length === 0) return

  try {
    await authFetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      body: { days }
    })
    await refreshTrip()
  } catch {}
}

watch(trip, () => {
  autoGenerateDays()
}, { immediate: true })

const selectedDay = ref(1)

const formatCollaboratorName = (collab?: CollaboratorEntry) => {
  if (!collab) return ''
  if (collab.email) return collab.email
  if (collab.uid) return `ID:${String(collab.uid).slice(0, 6)}`
  return ''
}

const tripEditors = computed(() => {
  const collabs = Array.isArray(trip.value?.collaborators) ? trip.value?.collaborators : []
  return collabs
    .filter((collab) => collab.role === 'editor')
    .map((collab) => formatCollaboratorName(collab))
    .filter((name) => Boolean(name))
})

// 篩選出符合「目前選中天數」的行程
const filteredItineraries = computed(() => {
  if (!itineraries.value) return []
  return itineraries.value
    .filter(item => item.day === selectedDay.value)
    .sort((a, b) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return (a.time || '00:00').localeCompare(b.time || '00:00')
    })
})

// 拖曳用的可寫入列表
const draggableItineraries = ref<any[]>([])

watch(filteredItineraries, (val) => {
  draggableItineraries.value = [...val]
}, { immediate: true })

// 拖曳結束後，更新所有項目的 order
const onDragEnd = async () => {
  const updates = draggableItineraries.value.map((item, index) => ({
    id: item.id,
    order: index
  }))

  try {
    await Promise.all(
      updates.map(({ id, order }) =>
        authFetch(`/api/itinerary/${id}`, {
          method: 'PUT',
          body: { order }
        })
      )
    )
    await refresh()
  } catch (err) {
    alert('排序儲存失敗')
    await refresh()
  }
}

// --- Google Maps 連結產生器 ---
const getMapUrl = (location: string) => {
  if (!location) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

const getDirectionsUrl = (origin: string, destination: string) => {
  if (!origin || !destination) return '#'
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}

type NoteSegment = {
  text: string
  href?: string
}

// 保留備註原文，只將網址片段轉成可點擊的 http(s) 連結。
const linkifyNotes = (notes: string): NoteSegment[] => {
  const urlPattern = /(?:https?:\/\/|www\.)[^\s<]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/[^\s<]*)?/gi
  const trailingPunctuation = /[.,!?;:\])}>，。！？；：）】》」』]+$/
  const segments: NoteSegment[] = []
  let cursor = 0

  for (const match of notes.matchAll(urlPattern)) {
    const matchIndex = match.index ?? 0
    const rawUrl = match[0]
    const punctuation = rawUrl.match(trailingPunctuation)?.[0] ?? ''
    const urlText = punctuation ? rawUrl.slice(0, -punctuation.length) : rawUrl

    if (matchIndex > cursor) {
      segments.push({ text: notes.slice(cursor, matchIndex) })
    }

    if (urlText) {
      segments.push({
        text: urlText,
        href: /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`
      })
    }

    if (punctuation) {
      segments.push({ text: punctuation })
    }

    cursor = matchIndex + rawUrl.length
  }

  if (cursor < notes.length) {
    segments.push({ text: notes.slice(cursor) })
  }

  return segments.length ? segments : [{ text: notes }]
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
        background: #fff5e3; 
        color: #ff8d41;
        border: none; 
        padding: 0.5rem 0.9rem; 
        border-radius: 999px;
        cursor: pointer; 
        font-size: 1rem; 
        font-weight: 700;
        font-weight: bold; 
        transition: background 0.2s;
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
      background: #fa8a3e; 
      color: white; 
      border: none; 
      padding: 0.65rem 1.4rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer; font-weight: bold;
      box-shadow: 0 10px 24px rgba(255, 138, 62, 0.3);
      transition: transform 0.2s ease;
      &:hover { transform: translateY(-2px); }
      &:disabled { background: #d1d5db; cursor: not-allowed; }
    }
  }
}

/* 行程卡片 */
.itinerary-list { display: flex; flex-direction: column; }

/* 拖曳相關 */
.draggable-item {
  cursor: default;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  color: #FFD283;
  cursor: grab;
  font-size: 1.1rem;
  flex-shrink: 0;
  transition: color 0.2s;
  
  &:hover { color: #FEA365; }
  &:active { cursor: grabbing; }
}

.drag-ghost {
  opacity: 0.4;
}

.drag-chosen .card {
  box-shadow: 0 8px 24px rgba(254, 163, 101, 0.35);
  transform: scale(1.02);
}

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
  // margin: -0.25rem 0; /* 讓它跟兩邊卡片靠近一點 */
  
  .connector-line {
    width: 3rem; /* 對齊卡片的時間寬度 */
    height: 100%;
    min-height: 2.5rem;
    position: relative;
    margin: 0.5rem 0;
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
  padding: 1.25rem 1.25rem 1.25rem 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  position: relative;
  
  .card-time { font-weight: bold; color: #FEA365; width: 3rem; }
  .card-body {
    flex: 1 1 60%;
    
    @media (max-width: 640px) {
      padding-bottom: 2.5rem; /* 預留空間給右下角的按鈕 */
    }
    
    .card-body-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .category { font-size: 0.75rem; background: #FFD283; color: #514137; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; }
    h3 { margin: 0.5rem 0 0.25rem 0; font-size: 1.125rem; }
    p { margin: 0; color: #6b7280; font-size: 0.875rem; }
    .notes {
      color: #6b7280;
      font-size: 0.8125rem;
      margin: 0.25rem 0 0;
      white-space: pre-line;

      .notes-link {
        color: #2563eb;
        text-decoration: underline;
        overflow-wrap: anywhere;

        &:hover {
          color: #1d4ed8;
        }
      }
    }
    .card-editors {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;

      .label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .name {
        background: rgba(16,185,129,0.16);
        color: #047857;
        border-radius: 999px;
        padding: 0.15rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
      }
    }
  }
  .card-actions {
    display: flex;
    // flex-direction: column;
    gap: 0.5rem;
    
    @media (max-width: 640px) {
      position: absolute;
      bottom: 1.25rem;
      right: 1.25rem;
    }
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
