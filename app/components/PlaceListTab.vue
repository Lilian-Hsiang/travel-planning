<template>
  <div class="place-list-tab">
    <div class="header">
      <h2>{{ title }}</h2>
      <button
        @click="openAddModal"
        class="add-btn"
        :disabled="!canEdit"
        :title="!canEdit ? '僅檢視權限，無法新增' : ''"
      >
        + 新增{{ placeLabel }}
      </button>
    </div>

    <div v-if="pending" class="empty-state">載入中...</div>
    <div v-else-if="places.length === 0" class="empty-state">
      目前還沒有任何紀錄喔！
    </div>

    <div v-else class="place-grid">
      <div v-for="place in places" :key="place.id" class="place-card">
        <div class="card-header">
          <h3>{{ place.name }}</h3>
          <div class="actions" v-if="canEdit">
            <button class="edit-btn" @click="openEditModal(place)"><FontAwesomeIcon :icon="['fas', 'pen-to-square']" aria-hidden="true" /></button>
            <button class="delete-btn" @click="openDeleteConfirm(place)"><FontAwesomeIcon :icon="['fas', 'trash']" aria-hidden="true" /></button>
          </div>
        </div>
        <p class="location">
          📍 <a :href="getMapUrl(place.location)" target="_blank" class="location-link">{{ place.location }}</a>
        </p>

        <div class="items-section">
          <h4>{{ itemLabel }}清單</h4>
          <ul class="items-list">
            <li v-for="item in (place.items || [])" :key="item.id" class="item-row">
              <label class="checkbox-label">
                <input type="checkbox" :checked="item.isCompleted" @change="toggleItem(place, item.id)" :disabled="!canEdit" />
                <span :class="{ completed: item.isCompleted }">{{ item.name }}</span>
              </label>
              <button class="delete-item-btn" @click="deleteItem(place, item.id)" :disabled="!canEdit">✕</button>
            </li>
          </ul>
          <form @submit.prevent="addItem(place)" class="add-item-form">
            <input
              v-model="newItemNames[place.id]"
              type="text"
              :placeholder="`新增${itemLabel}...`"
              :disabled="!canEdit"
            />
            <button type="submit" :disabled="!canEdit || !newItemNames[place.id]?.trim()">＋</button>
          </form>
        </div>
      </div>
    </div>

    <!-- 新增 / 編輯 Modal -->
    <AppModal :is-open="isModalOpen" :title="isEditing ? `編輯${placeLabel}` : `新增${placeLabel}`" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-group">
          <label>{{ placeLabel }}名稱</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>地點</label>
          <input v-model="form.location" type="text" required />
        </div>
        <button type="submit" class="submit-btn">確認儲存</button>
      </form>
    </AppModal>

    <!-- 刪除確認 Modal -->
    <AppModal :is-open="isDeleteModalOpen" title="刪除確認" @close="closeDeleteModal">
      <div class="delete-confirm-content">
        <p>確定要刪除「<strong>{{ deletingPlace?.name }}</strong>」嗎？</p>
        <p class="warning-text">此動作無法還原，並且將會刪除其底下的所有項目。</p>
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

const props = defineProps<{
  listType: 'shopping' | 'food'
  tripId: string | string[]
  accessRole?: 'owner' | 'editor' | 'viewer'
}>()

const { authFetch } = useAuthFetch()
const { user } = useAuth()

const title = computed(() => props.listType === 'shopping' ? '購物清單' : '美食清單')
const placeLabel = computed(() => props.listType === 'shopping' ? '店家' : '餐廳')
const itemLabel = computed(() => props.listType === 'shopping' ? '購物' : '必吃')
const apiPath = computed(() => `/api/${props.listType}`)
const canEdit = computed(() => ['owner', 'editor'].includes(props.accessRole || 'viewer'))

const { data: placesData, pending, refresh } = await useAsyncData(
  `${props.listType}-${props.tripId}`,
  () => authFetch(`${apiPath.value}?tripId=${props.tripId}`),
  {
    server: false,
    immediate: false,
    watch: [user]
  }
)

if (user.value) {
  refresh()
}

const places = computed(() => placesData.value || [])

// --- 新增/編輯 邏輯 ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', location: '' })

const openAddModal = () => {
  if (!canEdit.value) return
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', location: '' }
  isModalOpen.value = true
}

const openEditModal = (place: any) => {
  if (!canEdit.value) return
  isEditing.value = true
  editingId.value = place.id
  form.value = { name: place.name, location: place.location }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const submitForm = async () => {
  if (!canEdit.value) return
  try {
    if (isEditing.value && editingId.value) {
      await authFetch(`${apiPath.value}/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await authFetch(apiPath.value, {
        method: 'POST',
        body: { ...form.value, tripId: props.tripId }
      })
    }
    closeModal()
    await refresh()
  } catch (e) {
    alert(`儲存${placeLabel.value}失敗`)
  }
}

// --- 刪除 邏輯 ---
const isDeleteModalOpen = ref(false)
const deletingPlace = ref<any>(null)

const openDeleteConfirm = (place: any) => {
  if (!canEdit.value) return
  deletingPlace.value = place
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  deletingPlace.value = null
}

const confirmDelete = async () => {
  if (!canEdit.value) return
  if (!deletingPlace.value) return
  try {
    await authFetch(`${apiPath.value}/${deletingPlace.value.id}`, { method: 'DELETE' })
    closeDeleteModal()
    await refresh()
  } catch (e) {
    alert(`刪除${placeLabel.value}失敗`)
  }
}

// Map url generator
const getMapUrl = (location: string) => {
  if (!location) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

// --- 子項目 邏輯 ---
const newItemNames = ref<Record<string, string>>({})

const generateId = () => Math.random().toString(36).substring(2, 9)

const addItem = async (place: any) => {
  if (!canEdit.value) return
  const name = newItemNames.value[place.id]?.trim()
  if (!name) return

  const newItem = { id: generateId(), name, isCompleted: false }
  const updatedItems = [...(place.items || []), newItem]

  // Optimistic update locally could be done here, but we just trigger refetch for simplicity
  try {
    await authFetch(`${apiPath.value}/${place.id}`, {
      method: 'PUT',
      body: { items: updatedItems }
    })
    newItemNames.value[place.id] = ''
    await refresh()
  } catch (e) {
    alert('新增項目失敗')
  }
}

const toggleItem = async (place: any, itemId: string) => {
  if (!canEdit.value) return
  const updatedItems = (place.items || []).map((item: any) => {
    if (item.id === itemId) return { ...item, isCompleted: !item.isCompleted }
    return item
  })

  try {
    await authFetch(`${apiPath.value}/${place.id}`, {
      method: 'PUT',
      body: { items: updatedItems }
    })
    await refresh()
  } catch (e) {
    alert('狀態更新失敗')
  }
}

const deleteItem = async (place: any, itemId: string) => {
  if (!canEdit.value) return
  const updatedItems = (place.items || []).filter((item: any) => item.id !== itemId)

  try {
    await authFetch(`${apiPath.value}/${place.id}`, {
      method: 'PUT',
      body: { items: updatedItems }
    })
    await refresh()
  } catch (e) {
    alert('刪除項目失敗')
  }
}
</script>

<style lang="scss" scoped>
.place-list-tab {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.5rem;
    color: #1f2937;
    margin: 0;
  }

  .add-btn {
    background: #fa8a3e;
    color: white;
    border: none;
    padding: 0.65rem 1.4rem;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(255, 138, 62, 0.3);
    transition: transform 0.2s ease;
    &:hover { transform: translateY(-2px); }
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  background: white;
  border-radius: 1rem;
  border: 1px dashed #d1d5db;
}

.place-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.place-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #111827;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      &:hover { background: #f3f4f6; }
    }
  }
}

.location {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  
  .location-link {
    color: #9FAF64;
    font-weight: bold;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

.items-section {
  margin-top: auto;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;

  h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .items-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
    
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #374151;

        .completed {
          text-decoration: line-through;
          color: #9ca3af;
        }
      }

      .delete-item-btn {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 0.875rem;
        opacity: 0.5;
        &:hover { opacity: 1; }
      }
    }
  }

  .add-item-form {
    display: flex;
    gap: 0.5rem;

    input {
      flex: 1;
      padding: 0.35rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    button {
      background: #ffecdf;
      color: #fa8a3e;
      border: none;
      width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: bold;
      &:hover:not(:disabled) { background: #ffecdf; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }
}

/* Modals styles */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label { font-size: 0.875rem; font-weight: bold; color: #374151; }
    
    input {
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      &:focus {
        outline: none;
        border-color: #5A4CFA;
        box-shadow: 0 0 0 2px rgba(90, 76, 250, 0.2);
      }
    }
  }
  
  .submit-btn {
    margin-top: 1rem;
    background: #FEA365;
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    &:hover { background: #FEA365; }
  }
}

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

    .delete-btn {
      background: #fee2e2;
      border: none;
      color: #ef4444;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: bold;
      &:hover { background: #fca5a5; }
    }
  }
}
</style>
