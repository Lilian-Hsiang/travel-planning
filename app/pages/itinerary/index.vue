<template>
  <div class="trips-container">
    <header class="page-header">
      <div class="title-block">
        <NuxtLink class="back-link" to="/">← 返回首頁</NuxtLink>
        <h1>我的旅程</h1>
      </div>
      <button @click="isModalOpen = true" class="add-btn">+ 新增旅程</button>
    </header>

    <div v-if="pending" class="loading">載入中...</div>

    <template v-else>
      <section class="trip-section">
        <div class="section-headline">
          <div>
            <h2>我的旅程</h2>
            <p>你建立的旅程會列在這裡，可設定共編或刪除。</p>
          </div>
        </div>

        <div v-if="myTrips.length" class="trips-grid">
          <NuxtLink v-for="trip in myTrips" :key="trip.id" :to="`/itinerary/${trip.id}`" class="trip-card">
            <div class="card-tools">
              <button
                @click.prevent="openShareModal(trip)"
                class="share-trip-btn"
                title="分享與共編"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 15.5A3.5 3.5 0 1 0 12 22.5 3.5 3.5 0 0 0 12 15.5zm7.94-2.09l1.92-1.11a1 1 0 0 0 .37-1.37l-1.83-3.17a1 1 0 0 0-1.28-.4l-1.96.82a7.05 7.05 0 0 0-2.06-1.2l-.3-2.1A1 1 0 0 0 13.82 4h-3.64a1 1 0 0 0-.98.88l-.3 2.1a7.05 7.05 0 0 0-2.06 1.2l-1.96-.82a1 1 0 0 0-1.28.4L1.77 10A1 1 0 0 0 2.14 11.4l1.92 1.11a7.45 7.45 0 0 0 0 2l-1.92 1.11a1 1 0 0 0-.37 1.37l1.83 3.17a1 1 0 0 0 1.28.4l1.96-.82a7.05 7.05 0 0 0 2.06 1.2l.3 2.1a1 1 0 0 0 .98.88h3.64a1 1 0 0 0 .98-.88l.3-2.1a7.05 7.05 0 0 0 2.06-1.2l1.96.82a1 1 0 0 0 1.28-.4l1.83-3.17a1 1 0 0 0-.37-1.37l-1.92-1.11a7.45 7.45 0 0 0 0-2z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                @click.prevent="openDeleteModal(trip.id)"
                class="delete-trip-btn"
                title="刪除旅程"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div class="card-cover"></div>
            <div class="card-info">
              <h2>{{ trip.name }}</h2>
              <p>{{ trip.startDate }} ~ {{ trip.endDate }}</p>
              <span class="card-role-pill owner">{{ roleLabel('owner') }}</span>
              <div v-if="collaboratorPreview(trip).length" class="collab-preview">
                <span class="preview-label">共編者:</span>
                <span
                  v-for="(name, idx) in collaboratorPreview(trip)"
                  :key="`${trip.id}-owner-collab-${idx}`"
                  class="preview-pill"
                >
                  {{ name }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="empty-state">還沒有旅程，按右上角「新增旅程」開始規劃。</p>
      </section>

      <section class="trip-section collab">
        <div class="section-headline">
          <div>
            <h2>與我共編的旅程</h2>
            <p>朋友邀請或你參與的旅程顯示在這裡。</p>
          </div>
        </div>

        <div v-if="collabTrips.length" class="trips-grid">
          <NuxtLink v-for="trip in collabTrips" :key="trip.id" :to="`/itinerary/${trip.id}`" class="trip-card">
            <div class="card-tools">
              <button
                @click.prevent="openShareModal(trip)"
                class="share-trip-btn"
                title="查看共編資訊"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 15.5A3.5 3.5 0 1 0 12 22.5 3.5 3.5 0 0 0 12 15.5zm7.94-2.09l1.92-1.11a1 1 0 0 0 .37-1.37l-1.83-3.17a1 1 0 0 0-1.28-.4l-1.96.82a7.05 7.05 0 0 0-2.06-1.2l-.3-2.1A1 1 0 0 0 13.82 4h-3.64a1 1 0 0 0-.98.88l-.3 2.1a7.05 7.05 0 0 0-2.06 1.2l-1.96-.82a1 1 0 0 0-1.28.4L1.77 10A1 1 0 0 0 2.14 11.4l1.92 1.11a7.45 7.45 0 0 0 0 2l-1.92 1.11a1 1 0 0 0-.37 1.37l1.83 3.17a1 1 0 0 0 1.28.4l1.96-.82a7.05 7.05 0 0 0 2.06 1.2l.3 2.1a1 1 0 0 0 .98.88h3.64a1 1 0 0 0 .98-.88l.3-2.1a7.05 7.05 0 0 0 2.06-1.2l1.96.82a1 1 0 0 0 1.28-.4l1.83-3.17a1 1 0 0 0-.37-1.37l-1.92-1.11a7.45 7.45 0 0 0 0-2z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <div class="card-cover"></div>
            <div class="card-info">
              <h2>{{ trip.name }}</h2>
              <p>{{ trip.startDate }} ~ {{ trip.endDate }}</p>
              <span class="card-role-pill" :class="trip.accessRole">{{ roleLabel(trip.accessRole) }}</span>
              <div v-if="collaboratorPreview(trip).length" class="collab-preview">
                <span class="preview-label">共編者:</span>
                <span
                  v-for="(name, idx) in collaboratorPreview(trip)"
                  :key="`${trip.id}-collab-${idx}`"
                  class="preview-pill"
                >
                  {{ name }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="empty-state">目前沒有共編旅程，等待邀請或請朋友分享。</p>
      </section>
    </template>

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

    <!-- 分享 / 共編 Modal -->
    <AppModal :is-open="isShareModalOpen" title="分享與共編" @close="closeShareModal">
      <div v-if="shareTarget" class="share-modal">
        <div class="share-target-card">
          <div>
            <p class="label">目前旅程</p>
            <h3>{{ shareTarget.name }}</h3>
            <span>{{ shareTarget.startDate }} ~ {{ shareTarget.endDate }}</span>
          </div>
          <span class="role-pill">{{ activeRoleLabel }}</span>
        </div>

        <p v-if="isShareDetailsLoading" class="helper-text info">分享設定載入中...</p>
        <p v-else-if="!canManageShare" class="helper-text warning">
          你只有檢視權限，無法修改共編或邀請成員。
        </p>

        <section class="share-section">
          <div class="section-head">
            <h4>邀請成員</h4>
            <p>輸入 Email，可指定可編輯或僅檢視</p>
          </div>
          <form class="invite-form" @submit.prevent="handleSendInvite">
            <input
              v-model="shareInviteForm.email"
              type="email"
              placeholder="輸入 Email"
              required
              :disabled="!canManageShare || isSendingInvite"
            />
            <select v-model="shareInviteForm.role" :disabled="!canManageShare || isSendingInvite">
              <option value="editor">可編輯</option>
              <option value="viewer">僅檢視</option>
            </select>
            <button type="submit" :disabled="!canManageShare || isSendingInvite">
              {{ isSendingInvite ? '送出中...' : '送出' }}
            </button>
          </form>
          <p v-if="canManageShare" class="helper-text">提交後成員會立即擁有對應權限。</p>
          <p v-else class="helper-text warning">你沒有權限邀請成員。</p>
        </section>

        <section class="share-section">
          <div class="section-head">
            <h4>邀請連結</h4>
            <p>複製連結給朋友，他們登入後即可加入</p>
          </div>
          <div class="link-row">
            <input :value="shareLink" readonly />
            <button type="button" @click="copyShareLink">複製</button>
          </div>
          <label class="inline-label">
            預設權限
            <select
              v-model="shareLinkRole"
              @change="handleShareLinkRoleChange"
              :disabled="!canManageShare || isUpdatingShareLinkRole"
            >
              <option value="editor">可編輯</option>
              <option value="viewer">僅檢視</option>
            </select>
          </label>
          <p v-if="isUpdatingShareLinkRole" class="helper-text info">儲存預設權限中...</p>
        </section>

        <section class="share-section">
          <div class="section-head">
            <h4>已加入的成員</h4>
            <p>目前僅支援新增與查看，移除功能尚未完成</p>
          </div>
          <ul v-if="shareCollaborators.length" class="collaborator-list">
            <li v-for="collab in shareCollaborators" :key="collab.email || collab.uid">
              <div>
                <strong>{{ collab.email || collab.uid }}</strong>
                <span>{{ collab.uid }}</span>
              </div>
              <span class="role-pill" :class="collab.role">{{ roleLabel(collab.role) }}</span>
            </li>
          </ul>
          <p v-else class="helper-text">目前沒有其他成員。</p>
        </section>
      </div>
      <div v-else class="share-modal empty">
        <p>請選擇旅程後再分享。</p>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const { authFetch } = useAuthFetch()
const { push: pushToast } = useToast()

// server: false 讓資料只在客戶端提取，避免 SSR 時沒有 token
const { data: trips, pending, refresh } = await useAsyncData(
  'trips',
  () => authFetch('/api/trips'),
  { server: false }
)

const myTrips = computed(() => (trips.value || []).filter((trip) => trip.accessRole === 'owner'))
const collabTrips = computed(() => (trips.value || []).filter((trip) => trip.accessRole !== 'owner'))

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

// --- 分享與共編 UI ---
const isShareModalOpen = ref(false)
const shareTarget = ref(null)
const shareInviteForm = ref({ email: '', role: 'editor' })
const shareLinkRole = ref('viewer')
const shareCollaborators = ref([])
const isShareDetailsLoading = ref(false)
const isSendingInvite = ref(false)
const isUpdatingShareLinkRole = ref(false)
const appOrigin = ref('')

const canManageShare = computed(() => {
  const role = shareTarget.value?.accessRole || 'viewer'
  return role === 'owner' || role === 'editor'
})

onMounted(() => {
  if (process.client) {
    appOrigin.value = window.location.origin
  }
})

const deriveCollaboratorEmails = (list) => {
  return Array.from(
    new Set(
      (list || [])
        .map((collab) => (collab.email ? collab.email.toLowerCase() : ''))
        .filter((value) => Boolean(value))
    )
  )
}

const updateActiveTripCache = (tripId, patch) => {
  if (tripId && trips.value) {
    const index = trips.value.findIndex((trip) => trip.id === tripId)
    if (index !== -1) {
      trips.value[index] = { ...trips.value[index], ...patch }
      trips.value = [...trips.value]
    }
  }

  if (shareTarget.value && shareTarget.value.id === tripId) {
    shareTarget.value = { ...shareTarget.value, ...patch }
  }
}

const fetchShareDetails = async () => {
  if (!shareTarget.value) return
  isShareDetailsLoading.value = true
  try {
    const data = await authFetch(`/api/trips/${shareTarget.value.id}/sharing`)
    shareCollaborators.value = Array.isArray(data.collaborators) ? data.collaborators : []
    shareLinkRole.value = data.shareLinkRole || 'viewer'
    updateActiveTripCache(shareTarget.value.id, {
      collaborators: shareCollaborators.value,
      shareLinkRole: shareLinkRole.value,
      collaboratorEmails: deriveCollaboratorEmails(shareCollaborators.value),
    })
  } catch (error) {
    const message = error?.data?.message || '無法載入分享設定'
    pushToast(message, 'error')
  } finally {
    isShareDetailsLoading.value = false
  }
}

const openShareModal = (trip) => {
  shareTarget.value = trip
  shareInviteForm.value = { email: '', role: 'editor' }
  shareCollaborators.value = Array.isArray(trip.collaborators) ? trip.collaborators : []
  shareLinkRole.value = trip.shareLinkRole || 'viewer'
  isShareModalOpen.value = true
  fetchShareDetails()
}

const closeShareModal = () => {
  isShareModalOpen.value = false
  shareInviteForm.value = { email: '', role: 'editor' }
  shareTarget.value = null
  shareCollaborators.value = []
  shareLinkRole.value = 'viewer'
  isShareDetailsLoading.value = false
}

const handleSendInvite = async () => {
  if (!shareTarget.value) return
  if (!canManageShare.value) {
    pushToast('你沒有權限邀請成員', 'error')
    return
  }

  isSendingInvite.value = true
  try {
    const response = await authFetch(`/api/trips/${shareTarget.value.id}/sharing/invite`, {
      method: 'POST',
      body: shareInviteForm.value,
    })
    shareCollaborators.value = Array.isArray(response.collaborators) ? response.collaborators : []
    shareInviteForm.value = { email: '', role: 'editor' }
    updateActiveTripCache(shareTarget.value.id, {
      collaborators: shareCollaborators.value,
      collaboratorEmails: deriveCollaboratorEmails(shareCollaborators.value),
    })
    pushToast('已送出邀請', 'success')
  } catch (error) {
    const message = error?.data?.message || '邀請失敗'
    pushToast(message, 'error')
  } finally {
    isSendingInvite.value = false
  }
}

const handleShareLinkRoleChange = async () => {
  if (!shareTarget.value) return
  if (!canManageShare.value) {
    shareLinkRole.value = shareTarget.value?.shareLinkRole || 'viewer'
    pushToast('你沒有權限調整預設權限', 'error')
    return
  }

  isUpdatingShareLinkRole.value = true
  const desiredRole = shareLinkRole.value
  try {
    await authFetch(`/api/trips/${shareTarget.value.id}/sharing/link-role`, {
      method: 'PUT',
      body: { role: desiredRole },
    })
    updateActiveTripCache(shareTarget.value.id, { shareLinkRole: desiredRole })
    pushToast('預設權限已更新', 'success')
  } catch (error) {
    const message = error?.data?.message || '更新預設權限失敗'
    pushToast(message, 'error')
    shareLinkRole.value = shareTarget.value?.shareLinkRole || 'viewer'
  } finally {
    isUpdatingShareLinkRole.value = false
  }
}

const shareLink = computed(() => {
  if (!shareTarget.value) return ''
  const origin = appOrigin.value || 'https://travel.app'
  return `${origin}/invite/${shareTarget.value.id}?role=${shareLinkRole.value}`
})

const copyShareLink = async () => {
  if (!shareLink.value) return
  try {
    await navigator.clipboard.writeText(shareLink.value)
    pushToast('已複製邀請連結', 'success')
  } catch (error) {
    console.error(error)
    pushToast('瀏覽器不支援自動複製，請手動複製文字', 'error')
  }
}

const roleLabel = (role) => {
  if (role === 'owner') return '擁有者'
  if (role === 'editor') return '可編輯'
  return '僅檢視'
}
const activeRoleLabel = computed(() => roleLabel(shareTarget.value?.accessRole || 'owner'))

const formatCollaboratorName = (collab) => {
  if (!collab) return ''
  if (collab.email) return collab.email
  if (collab.uid) return `ID:${String(collab.uid).slice(0, 6)}`
  return ''
}

const collaboratorNames = (trip) => {
  const list = Array.isArray(trip?.collaborators) ? trip.collaborators : []
  return list.map(formatCollaboratorName).filter(Boolean)
}

const collaboratorPreview = (trip) => {
  const names = collaboratorNames(trip)
  if (!names.length) return []
  if (names.length <= 3) return names
  return [...names.slice(0, 2), `+${names.length - 2}`]
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
  gap: 1rem;
  
  .title-block {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .back-link {
    font-size: 0.95rem;
    text-decoration: none;
    color: #6b7280;
    transition: color 0.2s;

    &:hover {
      color: #374151;
    }
  }

  h1 { font-size: 1.75rem; color: #1f2937; margin: 0; }
  
  .add-btn {
    background: #FEA365;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #FFD283; }
  }
}

.trip-section {
  margin-bottom: 2.5rem;

  .section-headline {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;

    h2 {
      margin: 0;
      font-size: 1.35rem;
      color: #1f2937;
    }

    p {
      margin: 0.25rem 0 0;
      color: #6b7280;
      font-size: 0.9rem;
    }
  }
}

.empty-state {
  margin: 0.5rem 0 0;
  color: #9ca3af;
  font-size: 0.9rem;
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

  .card-tools {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: flex;
    gap: 0.35rem;
    z-index: 10;

    button {
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      background: rgba(255,255,255,0.85);
    }

    .share-trip-btn {
      color: #4c1d95;
      svg { width: 1.1rem; height: 1.1rem; }

      &:hover { background: #4c1d95; color: white; }
    }

    .delete-trip-btn {
      color: #ef4444;
      svg { width: 1.1rem; height: 1.1rem; }

      &:hover { background: #ef4444; color: white; }
    }
  }

  &:hover {
    transform: translateY(-4px);
    .card-tools button { opacity: 1; }
  }
  
  .card-cover {
    height: 120px;
    background: linear-gradient(135deg, #FFD283 0%, #FEA365 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
  }
  
  .card-info {
    padding: 1.25rem;
    h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #1f2937; }
    p { margin: 0; color: #6b7280; font-size: 0.875rem; }
    .card-role-pill {
      margin-top: 0.75rem;
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(76,29,149,0.12);
      color: #4c1d95;

      &.owner { background: rgba(251,191,36,0.25); color: #92400e; }
      &.editor { background: rgba(16,185,129,0.18); color: #047857; }
      &.viewer { background: rgba(96,165,250,0.2); color: #1d4ed8; }
    }

    .collab-preview {
      margin-top: 0.5rem;
      margin-left: 0.75rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;

      .preview-label {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 600;
      }

      .preview-pill {
        background: #f3f4f6;
        color: #374151;
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
      }
    }
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
    input:focus { border-color: #FEA365; }
  }
  .submit-btn {
    background: #FEA365; color: white; padding: 1rem; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer;
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

/* 分享 / 共編 modal */
.share-modal {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &.empty {
    min-height: 120px;
    align-items: center;
    justify-content: center;
  }
}

.share-target-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 0.9rem;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff);

  .label {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }

  h3 { margin: 0.15rem 0 0.25rem; }
  span { color: #374151; font-size: 0.9rem; }
}

.role-pill {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(76,29,149,0.12);
  color: #4c1d95;
  font-size: 0.8rem;
  font-weight: 600;

  &.viewer { background: rgba(96,165,250,0.2); color: #1d4ed8; }
  &.editor { background: rgba(16,185,129,0.2); color: #047857; }
}

.share-section {
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;

  .section-head {
    margin-bottom: 0.75rem;
    h4 { margin: 0; }
    p { margin: 0.1rem 0 0; color: #6b7280; font-size: 0.85rem; }
  }
}

.invite-form {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 0.5rem;

  input,
  select {
    border: 1px solid #e5e7eb;
    border-radius: 0.6rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    transition: border 0.2s, background 0.2s;
  }

  input:disabled,
  select:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  button {
    border: none;
    border-radius: 0.6rem;
    padding: 0.6rem 1.5rem;
    background: #5a4cfa;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:disabled {
    background: #c7d2fe;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.helper-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #9ca3af;

  &.warning { color: #f97316; }
  &.info { color: #4f46e5; }
}

.link-row {
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
    transition: background 0.2s;
  }

  button:disabled {
    background: #4b5563;
    cursor: not-allowed;
    border: 1px solid #e5e7eb;
    border-radius: 0.6rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    background: #f9fafb;
  }

  button {
    border: none;
    border-radius: 0.6rem;
    padding: 0.6rem 1rem;
    background: #111827;
    color: white;
    cursor: pointer;
  }
    transition: border 0.2s, background 0.2s;
  }

  select:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
}

.inline-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;

  select {
    border: 1px solid #e5e7eb;
    border-radius: 0.6rem;
    padding: 0.35rem 0.5rem;
  }
}

.collaborator-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;

    strong { display: block; font-size: 0.95rem; }
    span { display: block; font-size: 0.8rem; color: #9ca3af; }
  }
}
</style>