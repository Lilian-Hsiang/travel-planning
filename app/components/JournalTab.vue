<template>
  <div class="journal-tab">
    <div class="header">
      <h2>旅遊手帳</h2>
      <button
        @click="openAddModal"
        class="add-btn"
        :disabled="!canEdit"
        :title="!canEdit ? '僅檢視權限，無法新增' : ''"
      >
        + 新增日記
      </button>
    </div>

    <div v-if="pending" class="empty-state">載入中...</div>
    <div v-else-if="journals.length === 0" class="empty-state">
      目前還沒有日記喔，快來記錄你的旅程吧！
    </div>

    <div v-else class="journal-grid">
      <article v-for="journal in journals" :key="journal.id" class="journal-card">
        <div class="card-header">
          <div class="card-heading">
            <p class="date">{{ journal.date }}</p>
            <p class="meta-line" v-if="journal.weather || journal.mood">
              <span class="meta-label">天氣:</span>
              <span
                v-for="(emoji, weatherIndex) in splitEmojis(journal.weather)"
                :key="`weather-${journal.id}-${weatherIndex}`"
                class="meta-emoji"
              >
                {{ emoji }}
              </span>
              <br/>
              <span class="meta-label">心情:</span>
              <span
                v-for="(emoji, moodIndex) in splitEmojis(journal.mood)"
                :key="`mood-${journal.id}-${moodIndex}`"
                class="meta-emoji"
              >
                {{ emoji }}
              </span>
            </p>
            <p class="meta-line" v-if="journal.itinerary">
              <span class="meta-label">行程:</span>
              <span
                v-for="(emoji, itinIndex) in splitEmojis(journal.itinerary)"
                :key="`itinerary-${journal.id}-${itinIndex}`"
                class="meta-emoji"
              >
                {{ emoji }}
              </span>
            </p>
          </div>
          <div class="actions" v-if="canEdit">
            <button class="icon-btn" @click="openEditModal(journal)"><FontAwesomeIcon :icon="['fas', 'pen-to-square']" aria-hidden="true" /></button>
            <button class="icon-btn delete" @click="openDeleteConfirm(journal)"><FontAwesomeIcon :icon="['fas', 'trash']" aria-hidden="true" /></button>
          </div>
        </div>

        <div class="card-media" v-if="journal.photos && journal.photos.length">
          <div class="carousel">
            <div
              class="slides"
              :style="{ transform: `translateX(-${getSlideIndex(journal.id, journal.photos.length) * 100}%)` }"
            >
              <div v-for="(photo, photoIndex) in journal.photos" :key="photoIndex" class="slide">
                <img
                  :src="photo"
                  alt="Journal photo"
                  @click="openGallery(journal.photos, photoIndex)"
                />
              </div>
            </div>
            <button
              class="nav nav-prev"
              @click="moveSlide(journal.id, -1, journal.photos.length)"
              aria-label="上一張"
            >
              ‹
            </button>
            <button
              class="nav nav-next"
              @click="moveSlide(journal.id, 1, journal.photos.length)"
              aria-label="下一張"
            >
              ›
            </button>
            <div class="dots" v-if="journal.photos.length > 1">
              <button
                v-for="(photo, dotIndex) in journal.photos"
                :key="`dot-${journal.id}-${dotIndex}`"
                :class="{ active: dotIndex === getSlideIndex(journal.id, journal.photos.length) }"
                @click="setSlide(journal.id, dotIndex)"
              ></button>
            </div>
          </div>
        </div>

        <div class="card-body">
          <h3>{{ journal.theme }}</h3>
          <p>{{ journal.content }}</p>
        </div>
      </article>
    </div>

    <AppModal :is-open="isModalOpen" :title="isEditing ? '編輯日記' : '新增日記'" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-row">
          <div class="form-group flex-1">
            <label>日期</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group flex-1">
            <label>主題</label>
            <input v-model="form.theme" type="text" placeholder="例如：漫步在海岸線" required />
          </div>
        </div>

        <div class="form-row meta-selectors">
          <div class="form-group flex-1">
            <label>天氣 (可複選)</label>
            <div class="selected-pills" v-if="selectedWeather.length">
              <span v-for="(emoji, index) in selectedWeather" :key="`weather-pill-${index}`">{{ emoji }}</span>
            </div>
            <div class="emoji-grid">
              <button
                v-for="emoji in weatherEmojiOptions"
                :key="`weather-${emoji}`"
                type="button"
                class="emoji-btn"
                :class="{ active: form.weather.includes(emoji) }"
                @click="toggleEmoji('weather', emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
          <div class="form-group flex-1">
            <label>心情 (可複選)</label>
            <div class="selected-pills" v-if="selectedMood.length">
              <span v-for="(emoji, index) in selectedMood" :key="`mood-pill-${index}`">{{ emoji }}</span>
            </div>
            <div class="emoji-grid">
              <button
                v-for="emoji in moodEmojiOptions"
                :key="`mood-${emoji}`"
                type="button"
                class="emoji-btn"
                :class="{ active: form.mood.includes(emoji) }"
                @click="toggleEmoji('mood', emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>行程貼圖 (可複選)</label>
          <div class="selected-pills" v-if="selectedItinerary.length">
            <span v-for="(emoji, index) in selectedItinerary" :key="`itin-pill-${index}`">{{ emoji }}</span>
          </div>
          <div class="sticker-library">
            <div v-for="category in itineraryCategories" :key="category.name" class="sticker-category">
              <h4 class="category-title">{{ category.name }}</h4>
              <div class="sticker-grid">
                <button
                  v-for="sticker in category.items"
                  :key="`${category.name}-${sticker}`"
                  type="button"
                  class="sticker-btn"
                  :class="{ active: form.itinerary.includes(sticker) }"
                  @click="toggleEmoji('itinerary', sticker)"
                >
                  {{ sticker }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>內容與心得</label>
          <textarea v-model="form.content" rows="4" placeholder="寫下今天的沿路紀錄..." required></textarea>
        </div>

        <div class="form-group">
          <label>上傳照片 (可多張)</label>
          <div class="upload-area">
            <input type="file" accept="image/*" multiple @change="handleFileSelect" ref="fileInput" class="file-input" />
            <div v-if="form.photos && form.photos.length" class="preview-gallery">
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

    <teleport to="body">
      <div v-if="gallery.isOpen" class="gallery-overlay" @click.self="closeGallery">
        <button class="gallery-close" @click="closeGallery">✕</button>
        <div class="gallery-frame">
          <button
            v-if="gallery.photos.length > 1"
            class="gallery-nav prev"
            @click.stop="stepGallery(-1)"
            aria-label="上一張"
          >
            ‹
          </button>
          <img :src="currentGalleryPhoto" alt="Gallery item" />
          <button
            v-if="gallery.photos.length > 1"
            class="gallery-nav next"
            @click.stop="stepGallery(1)"
            aria-label="下一張"
          >
            ›
          </button>
        </div>
        <div class="gallery-thumbs" v-if="gallery.photos.length > 1">
          <button
            v-for="(photo, index) in gallery.photos"
            :key="`thumb-${index}`"
            :class="{ active: index === gallery.index }"
            @click="setGalleryIndex(index)"
          >
            <img :src="photo" alt="Gallery thumbnail" />
          </button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  tripId: string | string[]
  accessRole?: 'owner' | 'editor' | 'viewer'
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
const canEdit = computed(() => ['owner', 'editor'].includes(props.accessRole || 'viewer'))

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const weatherEmojiOptions = ['☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '🌩️', '🌦️', '🌫️', '❄️', '🌪️', '🌈']
const moodEmojiOptions = ['😀', '🥰', '🤩', '😌', '😎', '🤗', '🥳', '🤠', '😴', '🥲', '😭', '😤', '🤯', '😱']

const itineraryCategories = [
  {
    name: '動物與大自然',
    items: ['🐻', '🦊', '🦁', '🐯', '🦌', '🦜', '🦩', '🦋', '🌲', '🌸', '🌊', '🌿', '🍃']
  },
  {
    name: '美食與飲料',
    items: ['🍱', '🍣', '🍜', '🍰', '🍩', '🍻', '🍷', '🍡', '🥐', '🍕', '🍔', '🍓', '🧋']
  },
  {
    name: '活動',
    items: ['🎡', '🎢', '🎠', '🏖️', '🚴‍♀️', '🏄‍♂️', '🎨', '🎭', '🎯', '🎳', '🧗‍♀️', '🧘‍♂️']
  },
  {
    name: '旅遊與地標',
    items: ['✈️', '🚆', '🗽', '🗼', '🏰', '🏝️', '🏞️', '🌁', '🏯', '🚠', '🚢', '🛤️']
  }
]

const getTodayString = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const form = ref<{ date: string, theme: string, content: string, photos: string[], weather: string, mood: string, itinerary: string }>({
  date: getTodayString(),
  theme: '',
  content: '',
  photos: [],
  weather: '',
  mood: '',
  itinerary: ''
})

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('zh-Hant', { granularity: 'grapheme' }) : null
const splitEmojis = (value?: string | null) => {
  if (!value) return []
  if (!segmenter) return Array.from(value)
  const segments: string[] = []
  for (const part of segmenter.segment(value)) {
    if (part.isWordLike || part.segment.trim() !== '') {
      segments.push(part.segment)
    }
  }
  return segments
}

const selectedWeather = computed(() => splitEmojis(form.value.weather))
const selectedMood = computed(() => splitEmojis(form.value.mood))
const selectedItinerary = computed(() => splitEmojis(form.value.itinerary))

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const activeSlideByJournal = ref<Record<string, number>>({})

const gallery = ref<{ isOpen: boolean, photos: string[], index: number }>({
  isOpen: false,
  photos: [],
  index: 0
})

const currentGalleryPhoto = computed(() => gallery.value.photos[gallery.value.index] || '')

const primeSlides = (list: any[]) => {
  list.forEach((item) => {
    if (!item?.id) return
    if (activeSlideByJournal.value[item.id] === undefined) {
      activeSlideByJournal.value[item.id] = 0
    }
  })
}

watch(journals, (list) => {
  primeSlides(list)
}, { immediate: true })

const getSlideIndex = (journalId: string, total: number) => {
  if (!journalId || !total) return 0
  if (activeSlideByJournal.value[journalId] === undefined) {
    activeSlideByJournal.value[journalId] = 0
  }
  const current = activeSlideByJournal.value[journalId]
  return Math.min(Math.max(current, 0), total - 1)
}

const setSlide = (journalId: string, nextIndex: number) => {
  if (!journalId) return
  activeSlideByJournal.value[journalId] = nextIndex
}

const moveSlide = (journalId: string, direction: number, total: number) => {
  if (!journalId || !total) return
  const current = getSlideIndex(journalId, total)
  const next = (current + direction + total) % total
  activeSlideByJournal.value[journalId] = next
}

const openGallery = (photos: string[], startIndex = 0) => {
  if (!photos || !photos.length) return
  gallery.value = {
    isOpen: true,
    photos,
    index: Math.min(Math.max(startIndex, 0), photos.length - 1)
  }
  if (process.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeGallery = () => {
  gallery.value.isOpen = false
  gallery.value.photos = []
  gallery.value.index = 0
  if (process.client) {
    document.body.style.overflow = ''
  }
}

const stepGallery = (delta: number) => {
  if (!gallery.value.photos.length) return
  const total = gallery.value.photos.length
  gallery.value.index = (gallery.value.index + delta + total) % total
}

const setGalleryIndex = (index: number) => {
  gallery.value.index = index
}

const toggleEmoji = (field: 'weather' | 'mood' | 'itinerary', emoji: string) => {
  const segments = splitEmojis(form.value[field])
  const position = segments.indexOf(emoji)
  if (position >= 0) {
    segments.splice(position, 1)
  } else {
    segments.push(emoji)
  }
  form.value[field] = segments.join('')
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { date: getTodayString(), theme: '', content: '', photos: [], weather: '', mood: '', itinerary: '' }
  if (fileInput.value) fileInput.value.value = ''
  isModalOpen.value = true
}

const openEditModal = (journal: any) => {
  isEditing.value = true
  editingId.value = journal.id
  form.value = {
    date: journal.date || getTodayString(),
    theme: journal.theme || '',
    content: journal.content || '',
    photos: journal.photos ? [...journal.photos] : (journal.photoUrl ? [journal.photoUrl] : []),
    weather: journal.weather || '',
    mood: journal.mood || '',
    itinerary: journal.itinerary || ''
  }
  if (fileInput.value) fileInput.value.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  if (isUploading.value) return // 防止上傳中關閉
  isModalOpen.value = false
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
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
  // background: linear-gradient(135deg, #fff6e8 0%, #fefefe 60%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;

  h2 {
      margin: 0;
      font-size: 1.6rem;
      color: #3c2f23;
  }

  .add-btn {
    background: #ff8a3e;
    border: none;
    color: #fff;
    padding: 0.65rem 1.25rem;
    border-radius: 999px;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(255, 138, 62, 0.3);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(255, 179, 71, 0.5);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  border: 2px dashed rgba(255, 179, 71, 0.5);
  border-radius: 1.5rem;
  color: #a07b4f;
  background: rgba(255, 255, 255, 0.85);
}

.journal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.75rem;
}

.journal-card {
  background: #fffef8;
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 12px 28px rgba(76, 59, 44, 0.12);
  border: 1px solid rgba(255, 179, 71, 0.3);
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px dashed rgba(76, 59, 44, 0.15);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.card-heading {
  .date {
    margin: 0 0 0.35rem 0;
    color: #de8c3c;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .meta-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.9rem;
    color: #6b5845;
    margin: 0.15rem 0;
  }

  .meta-label {
    font-weight: 600;
    color: #b68a5f;
  }

  .meta-emoji {
    font-size: 1.05rem;
  }

  .meta-sep {
    opacity: 0.6;
  }
}

.actions {
  display: flex;
  gap: 0.35rem;

.icon-btn {
      border: none;
      background: #9FAF64;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;

      &.delete {
        background: #ff8d41;
        color: white;
      }
  }
}

.card-media {
  position: relative;
  margin-bottom: 1rem;

  .carousel {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid rgba(255, 179, 71, 0.4);
    background: #fff;
  }

  .slides {
    display: flex;
    transition: transform 0.4s ease;
  }

  .slide {
    min-width: 100%;
    aspect-ratio: 4 / 3;

    img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      cursor: zoom-in;
    }
  }

  .nav {
    position: absolute;
    top: 50%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #ffb24786;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    z-index: 2;
    transform: translateY(-50%);

    &.nav-prev {
      left: 0.75rem;
    }

    &.nav-next {
      right: 0.75rem;
    }
  }

  .dots {
    position: absolute;
    left: 50%;
    bottom: -1.1rem;
    transform: translateX(-50%);
    display: flex;
    gap: 0.4rem;

    button {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;

      &.active {
        background: #ff8a3e;
      }
    }
  }

  .open-gallery-btn {
    position: absolute;
    right: 0.75rem;
    bottom: 0;
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    border-radius: 999px;
    border: none;
    background: #ffd8a8;
    color: #744f2d;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(116, 79, 45, 0.2);
  }
}

.card-body {
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.35rem;
    color: #3d2c20;
  }

  p {
    margin: 0;
    color: #5c4b3d;
    line-height: 1.7;
    white-space: pre-line;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .flex-1 {
    flex: 1;
    min-width: 220px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #4c3b2c;
    }

    input,
    textarea {
      padding: 0.75rem;
      border-radius: 0.65rem;
      border: 1px solid rgba(76, 59, 44, 0.25);
      background: #fff;
      font-size: 1rem;
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }
  }

  .emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .emoji-btn {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: #fff7ee;
    font-size: 1.25rem;
    cursor: pointer;
    transition: transform 0.2s ease, border 0.2s ease;

    &.active {
      border-color: #ff8a3e;
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(255, 138, 62, 0.25);
    }
  }

  .selected-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;

    span {
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      border: 1px dashed rgba(255, 138, 62, 0.5);
      background: rgba(255, 239, 222, 0.8);
    }
  }

  .sticker-library {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(76, 59, 44, 0.2);
      border-radius: 3px;
    }
  }

  .sticker-category {
    border: 1px dashed rgba(76, 59, 44, 0.2);
    border-radius: 0.85rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.9);

    .category-title {
      margin: 0 0 0.5rem 0;
      color: #c07b2a;
      font-size: 0.85rem;
    }
  }

  .sticker-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .sticker-btn {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: #fff7ee;
    font-size: 1.2rem;
    cursor: pointer;

    &.active {
      border-color: #ff8a3e;
      background: #ffe7cf;
      transform: translateY(-1px);
    }
  }

  .upload-area {
    border: 2px dashed rgba(76, 59, 44, 0.3);
    padding: 1.5rem;
    border-radius: 1rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.9);

    .file-input {
      width: 100%;
      margin-bottom: 0.75rem;
    }

    .preview-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: flex-start;
    }

    .preview-item {
      position: relative;
      width: 90px;
      height: 90px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 0.65rem;
        border: 1px solid rgba(76, 59, 44, 0.2);
      }

      .remove-photo-btn {
        position: absolute;
        top: -0.35rem;
        right: -0.35rem;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: #ef4444;
        color: #fff;
        cursor: pointer;
      }
    }
  }

  .submit-btn {
    align-self: flex-end;
    padding: 0.85rem 1.75rem;
    border-radius: 999px;
    border: none;
    background: #ff8a3e;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(255, 138, 62, 0.35);
  }
}

.delete-confirm-content {
  text-align: center;
  padding: 1rem 0;

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
}

.gallery-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 21, 17, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
}

.gallery-frame {
  position: relative;
  width: min(900px, 90vw);
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;

  &.prev {
    left: 1rem;
  }

  &.next {
    right: 1rem;
  }
}

.gallery-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.gallery-thumbs {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;

  button {
    border: 2px solid transparent;
    border-radius: 0.5rem;
    padding: 0;
    width: 70px;
    height: 52px;
    overflow: hidden;
    cursor: pointer;

    &.active {
      border-color: #ffb347;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

@media (max-width: 768px) {
  .journal-grid {
    grid-template-columns: 1fr;
  }

  .card-media {
    padding-bottom: 2.75rem;

    .nav {
      width: 32px;
      height: 32px;
    }
  }
}
</style>
