<template>
  <div class="journal-tab">
    <div class="header">
      <h2>旅遊手帳</h2>
      <button @click="openAddModal" class="add-btn">+ 新增日記</button>
    </div>

    <div v-if="pending" class="empty-state">載入中...</div>
    <div v-else-if="journals.length === 0" class="empty-state">
      目前還沒有日記喔，快來記錄你的旅程吧！
    </div>

    <div v-else class="journal-list">
      <div v-for="journal in journals" :key="journal.id" class="journal-card">
        <div class="card-header">
          <div class="date-mood">
            <span class="date">{{ journal.date }}</span>
            <span class="mood-icon" v-if="journal.mood">{{ journal.mood }}</span>
          </div>
          <div class="actions">
            <button class="icon-btn edit" @click="openEditModal(journal)">✏️</button>
            <button class="icon-btn delete" @click="openDeleteConfirm(journal)">🗑️</button>
          </div>
        </div>
        
        <div class="card-body">
          <div v-if="journal.photos && journal.photos.length > 0" class="photo-gallery">
            <img v-for="(photo, index) in journal.photos" :key="index" :src="photo" alt="Journal Photo" class="gallery-img" />
          </div>
          <div class="text-wrapper" :class="{ 'full-width': !journal.photos || journal.photos.length === 0 }">
            <h3>{{ journal.theme }}</h3>
            <p class="content-text">{{ journal.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增 / 編輯 Modal -->
    <AppModal :is-open="isModalOpen" :title="isEditing ? '編輯日記' : '新增日記'" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-row">
          <div class="form-group flex-1">
            <label>日期</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group flex-1 sticker-group">
            <label>選擇心情或貼圖</label>
            <div v-if="selectedStickers.length" class="selected-stickers">
              <div class="selected-title">已選貼圖</div>
              <div class="selected-list">
                <button
                  v-for="(sticker, index) in selectedStickers"
                  :key="`selected-${index}-${sticker}`"
                  type="button"
                  class="selected-pill"
                  @click="removeSticker(index)"
                >
                  <span class="emoji">{{ sticker }}</span>
                  <span class="remove-icon">✕</span>
                </button>
              </div>
            </div>
            <div class="sticker-library">
              <div v-for="category in stickerCategories" :key="category.name" class="sticker-category">
                <h4 class="category-title">{{ category.name }}</h4>
                <div class="sticker-grid">
                  <button 
                    v-for="sticker in category.items" 
                    :key="sticker" 
                    type="button"
                    class="sticker-btn"
                    :class="{ active: form.mood.includes(sticker) }"
                    @click="addSticker(sticker)"
                  >
                    {{ sticker }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>主題</label>
          <input v-model="form.theme" type="text" placeholder="例如：漫步在美麗的海岸線" required />
        </div>

        <div class="form-group">
          <label>內容與心得</label>
          <textarea v-model="form.content" rows="4" placeholder="寫下今天的點點滴滴..." required></textarea>
        </div>

        <div class="form-group">
          <label>上傳照片 (可多張)</label>
          <div class="upload-area">
            <input type="file" accept="image/*" multiple @change="handleFileSelect" ref="fileInput" class="file-input" />
            <div v-if="form.photos && form.photos.length > 0" class="preview-gallery">
              <div v-for="(photo, index) in form.photos" :key="index" class="preview-item">
                <img :src="photo" alt="Preview" class="preview-img" />
                <button type="button" class="remove-photo-btn" @click="removePhoto(index)">✕</button>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isUploading">確認儲存</button>
      </form>
    </AppModal>

    <!-- 刪除確認 Modal -->
    <AppModal :is-open="isDeleteModalOpen" title="刪除確認" @close="closeDeleteModal">
      <div class="delete-confirm-content">
        <p>確定要刪除「<strong>{{ deletingJournal?.theme }}</strong>」這篇日記嗎？</p>
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

const props = defineProps<{
  tripId: string | string[]
}>()

const { authFetch } = useAuthFetch()
const { user } = useAuth()

const { data: journalsData, pending, refresh } = await useAsyncData(
  `journal-${props.tripId}`,
  () => authFetch(`/api/journal?tripId=${props.tripId}`),
  {
    server: false,
    immediate: false,
    watch: [user]
  }
)

if (user.value) {
  refresh()
}

const journals = computed(() => journalsData.value || [])

// --- 新增/編輯 邏輯 ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

  // --- 貼圖庫設定 ---
const stickerCategories = [
  {
    name: "笑臉與人物",
    items: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😮‍💨", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖"
    ]
  },
  {
    name: "動物與大自然",
    items: [
      "🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐅", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦫", "🦔", "🦇", "🐻", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦤", "🪶", "🦩", "🦚", "🦜", "🐸", "🐊", "🐢", "🦎", "🐉", "🦕", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🐙", "🐚", "🪸", "🐌", "🦋", "🐛", "🐝", "🪲", "🐞", "🦗", "🪳", "🕸️", "🦟", "🪰", "🪱", "🦠", "💐", "💮", "🏵️", "🥀", "🌺", "🌼", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "🍂", "🍃", "🍄", "🌰", "🦀", "🦞", "🦐", "🦑"
    ]
  },
  {
    name: "美食與飲料",
    items: [
      "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🥜", "🫘", "🌰", "🫚", "🫛", "🍄", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🦀", "🦞", "🦐", "🦑", "🦪", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🫗", "🥤", "🧋", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄", "🔪", "🏺"
    ]
  },
  {
    name: "活動",
    items: [
      "🎃", "🎄", "🎆", "🎇", "🧨", "✨", "🎈", "🎉", "🎊", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🧧", "🎀", "🎁", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅", "🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏐", "🏈", "🏉", "🎾", "🥏", "🎳", "🏏", "🏑", "🥍", "🥌", "🏓", "🏸", "🥊", "🥋", "🥅", "⛳", "⛸️", "🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🎯", "🪀", "🪁", "🔫", "🎱", "🔮", "🪄", "🎮", "🕹️", "🎰", "🎲", "🧩", "🧸", "🪅", "🪩", "🪆", "♠️", "♥️", "♦️", "♣️", "♟️", "🃏", "🀄", "🎴", "🎭", "🖼️", "🎨", "🧵", "🪡", "🧶", "🪢"
    ]
  },
  {
    name: "旅遊與地標",
    items: [
      "🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🪨", "🪵", "🛖", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🎡", "🎢", "💈", "🎪", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚", "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛺", "🚲", "🛴", "🛹", "🛼", "🚏", "🛣️", "🛤️", "🛢️", "⛽", "🚨", "🚥", "🚦", "🛑", "🚧", "⚓", "🛟", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️", "🚢", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸", "🛎️", "🧳", "⌛", "⏳", "⌚", "⏰", "⏱️", "⏲️", "🕰️", "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟", "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙", "🕥", "🕚", "🕦", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌙", "🌚", "🌛", "🌜", "🌡️", "☀️", "🌝", "🌞", "🪐", "⭐", "🌟", "🌠", "🌌", "☁️", "⛅", "🌤️", "🌥️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️", "🌀", "🌈", "🌂", "☂️", "☔", "⛱️", "⚡", "❄️", "☃️", "⛄", "☄️", "🔥", "💧", "🌊"
    ]
  }
]

const getTodayString = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const form = ref<{ date: string, mood: string, theme: string, content: string, photos: string[] }>({
  date: getTodayString(),
  mood: '',
  theme: '',
  content: '',
  photos: []
})

const selectedStickers = computed(() => Array.from(form.value.mood || ''))

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { date: getTodayString(), mood: '', theme: '', content: '', photos: [] }
  if (fileInput.value) fileInput.value.value = ''
  isModalOpen.value = true
}

const openEditModal = (journal: any) => {
  isEditing.value = true
  editingId.value = journal.id
  form.value = {
    date: journal.date || getTodayString(),
    mood: journal.mood || '',
    theme: journal.theme || '',
    content: journal.content || '',
    photos: journal.photos ? [...journal.photos] : (journal.photoUrl ? [journal.photoUrl] : [])
  }
  if (fileInput.value) fileInput.value.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  if (isUploading.value) return // 防止上傳中關閉
  isModalOpen.value = false
}

const addSticker = (sticker: string) => {
  form.value.mood += sticker
}

const removeSticker = (index: number) => {
  const stickers = Array.from(form.value.mood || '')
  stickers.splice(index, 1)
  form.value.mood = stickers.join('')
}

// --- 照片多張上傳邏輯 (轉換為 Base64) ---
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  isUploading.value = true

  const readPromises = Array.from(files).map((file) => {
    return new Promise<string>((resolve, reject) => {
      // 限制單張 1MB 避免單份文檔過大
      if (file.size > 1024 * 1024) {
        alert(`照片 ${file.name} 檔案過大！請上傳小於 1MB 的圖片。`)
        resolve('') // 返回空字串略過
        return
      }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => {
        console.error('圖片轉換失敗', error)
        resolve('')
      }
    })
  })

  const results = await Promise.all(readPromises)
  const validPhotos = results.filter(res => res !== '')
  
  form.value.photos = [...form.value.photos, ...validPhotos]
  
  if (fileInput.value) fileInput.value.value = ''
  isUploading.value = false
}

const removePhoto = (index: number) => {
  form.value.photos.splice(index, 1)
}

// --- 儲存表單 ---
const submitForm = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await authFetch(`/api/journal/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await authFetch('/api/journal', {
        method: 'POST',
        body: { ...form.value, tripId: props.tripId }
      })
    }
    closeModal()
    await refresh()
  } catch (e) {
    alert(`儲存日記失敗`)
  }
}

// --- 刪除 邏輯 ---
const isDeleteModalOpen = ref(false)
const deletingJournal = ref<any>(null)

const openDeleteConfirm = (journal: any) => {
  deletingJournal.value = journal
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  deletingJournal.value = null
}

const confirmDelete = async () => {
  if (!deletingJournal.value) return
  try {
    await authFetch(`/api/journal/${deletingJournal.value.id}`, { method: 'DELETE' })
    closeDeleteModal()
    await refresh()
  } catch (e) {
    alert(`刪除日記失敗`)
  }
}
</script>

<style lang="scss" scoped>
.journal-tab {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h2 { font-size: 1.5rem; color: #1f2937; margin: 0; }
  .add-btn {
    background: #fa8a3e; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold;
    &:hover { background: #ff8a3e; }
  }
}

.empty-state { text-align: center; padding: 3rem; color: #9ca3af; background: white; border-radius: 1rem; border: 1px dashed #d1d5db; }

.journal-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.journal-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 6px -1px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.75rem;

  .date-mood {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    .date { font-weight: bold; color: #5A4CFA; font-size: 1.125rem; }
    .mood-icon { font-size: 1.5rem; }
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    .icon-btn {
      background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; border-radius: 0.25rem;
      &:hover { background: #f3f4f6; }
    }
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  .photo-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
    
    .gallery-img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }
  }

  .text-wrapper {
    flex: 1;
    min-width: 0;

    h3 { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #111827; }
    .content-text {
      margin: 0; color: #4b5563; font-size: 0.9375rem; line-height: 1.6;
      white-space: pre-line;
    }
    
    &.full-width {
      width: 100%;
    }
  }
}

/* Modal form styles */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  
  .form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .flex-1 { flex: 1; min-width: 200px; }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label { font-size: 0.875rem; font-weight: bold; color: #374151; }
    
    input[type="text"], input[type="date"], select, textarea {
      padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem;
      background: white;
      transition: all 0.2s;
      &:focus { outline: none; border-color: #5A4CFA; box-shadow: 0 0 0 2px rgba(90, 76, 250, 0.2); }
    }
    textarea { resize: vertical; min-height: 100px; }
  }

  /* Sticker Library */
  .sticker-group {
    width: 100%; // Let it take full width below date
  }

  .selected-stickers {
    background: rgba(255, 255, 255, 0.95);
    border: 1px dashed rgba(254, 163, 101, 0.4);
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;

    .selected-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #fdba74;
      margin-bottom: 0.5rem;
    }

    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .selected-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      border: 1px solid rgba(254, 163, 101, 0.6);
      background: rgba(255, 210, 131, 0.2);
      cursor: pointer;
      font-size: 1rem;
      line-height: 1.2;
      transition: transform 0.2s, background 0.2s;

      .emoji { font-size: 1.25rem; }
      .remove-icon { font-size: 0.8rem; color: #fb923c; }

      &:hover {
        transform: translateY(-1px);
        background: rgba(255, 210, 131, 0.35);
      }
    }
  }

  .sticker-library {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    max-height: 250px;
    overflow-y: auto;
    
    // Custom scrollbar
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

    .sticker-category {
      .category-title {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #6b7280;
        /* position: sticky; */ /* 移除釘選效果 */
        /* top: 0; */
        background: #f9fafb;
        padding: 0.25rem 0;
        z-index: 1;
        margin-top: 1rem; // Add a little spacing between sets if position sticky is removed
      }
      
      .sticker-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        .sticker-btn {
          background: white;
          border: 1px solid transparent;
          font-size: 1.5rem;
          padding: 0.25rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover { transform: scale(1.2); border-color: #d1d5db; }
          &.active {
            background: #e0e7ff;
            border-color: #5A4CFA;
            transform: scale(1.1);
            box-shadow: 0 2px 4px rgba(90, 76, 250, 0.2);
          }
        }
      }
    }
  }

  /* Upload Area */
  .upload-area {
    border: 2px dashed #d1d5db;
    padding: 1.5rem;
    border-radius: 0.5rem;
    background: #f9fafb;
    text-align: center;
    transition: all 0.2s;

    &:hover { border-color: #9ca3af; }
    
    .file-input { 
      width: 100%; 
      margin-bottom: 0.5rem; 
      font-size: 0.875rem;
      &::file-selector-button {
        background: white;
        border: 1px solid #d1d5db;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        margin-right: 1rem;
        &:hover { background: #f3f4f6; }
      }
    }
    
    .preview-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      justify-content: flex-start;
      
      .preview-item {
        position: relative;
        width: 100px;
        height: 100px;

        .preview-img { width: 100%; height: 100%; border-radius: 0.5rem; object-fit: cover; border: 1px solid #e5e7eb; }
        .remove-photo-btn {
          position: absolute; top: -0.5rem; right: -0.5rem; 
          background: #ef4444; color: white; border: none; 
          width: 1.5rem; height: 1.5rem; border-radius: 50%; 
          font-size: 0.75rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          &:hover { background: #dc2626; transform: scale(1.1); }
        }
      }
    }
  }
  
  .submit-btn {
    margin-top: 1rem; background: #5A4CFA; color: white; border: none; padding: 0.875rem; border-radius: 0.5rem; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.2s;
    &:hover:not(:disabled) { background: #4C3EEA; transform: translateY(-1px); }
    &:disabled { background: #9ca3af; cursor: not-allowed; }
  }
}

.delete-confirm-content {
  padding: 1rem 0; text-align: center;
  p { margin-bottom: 0.5rem; color: #374151; }
  .warning-text { color: #dc2626; font-size: 0.875rem; margin-bottom: 1.5rem; }
  
  .modal-actions {
    display: flex; justify-content: center; gap: 1rem;
    .cancel-btn { padding: 0.5rem 1rem; border: 1px solid #d1d5db; background: white; border-radius: 0.5rem; cursor: pointer; font-weight: bold; color: #374151; &:hover { background: #f3f4f6; } }
    .delete-btn { background: #fee2e2; border: none; color: #ef4444; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; &:hover { background: #fca5a5; } }
  }
}
</style>
