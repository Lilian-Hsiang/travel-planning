<template>
  <div class="packing-list-tab">
    <div class="header">
      <h2>行李清單</h2>
      <button
        @click="loadDefaultChecklist"
        class="add-btn"
        v-if="canEdit && places.length === 0"
      >
        載入預設行李清單
      </button>
    </div>

    <div v-if="pending" class="empty-state">載入中...</div>
    <div v-else-if="places.length === 0" class="empty-state">
      目前還沒有任何行李紀錄喔！點擊上方按鈕載入預設清單吧～
    </div>

    <div v-else class="place-grid">
      <div v-for="category in categories" :key="category" class="place-card">
        <div class="card-header">
          <h3>{{ category }}</h3>
        </div>

        <div class="items-section">
          <ul class="items-list">
            <li v-for="item in getItemsByCategory(category)" :key="item.id" class="item-row">
              <label class="checkbox-label">
                <input type="checkbox" :checked="item.isCompleted" @change="toggleItem(item)" :disabled="!canEdit" />
                <span :class="{ completed: item.isCompleted }">{{ item.name }}</span>
              </label>
              <button class="delete-item-btn" @click="deleteItem(item.id)" :disabled="!canEdit">✕</button>
            </li>
          </ul>
          <form @submit.prevent="addItem(category)" class="add-item-form">
            <input
              v-model="newItemNames[category]"
              type="text"
              placeholder="新增物品..."
              :disabled="!canEdit"
            />
            <button type="submit" :disabled="!canEdit || !newItemNames[category]?.trim()">＋</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  tripId: string | string[]
  accessRole?: 'owner' | 'editor' | 'viewer'
}>()

const { authFetch } = useAuthFetch()
const { user } = useAuth()

const canEdit = computed(() => ['owner', 'editor'].includes(props.accessRole || 'viewer'))

const { data: luggageData, pending, refresh } = await useAsyncData(
  `luggage-${props.tripId}`,
  () => authFetch(`/api/luggage?tripId=${props.tripId}`),
  {
    server: false,
    immediate: false,
    watch: [user]
  }
)

if (user.value) {
  refresh()
}

const places = computed(() => luggageData.value || [])

// The categories referenced from the checklist image provided
const categories = [
  '重要證件',
  '衣物類',
  '3C 物品',
  '日常、盥洗用品',
  '其他物品'
]

const getItemsByCategory = (category: string) => {
  return places.value.filter((item: any) => item.category === category)
}

const newItemNames = ref<Record<string, string>>({})

const loadDefaultChecklist = async () => {
  if (!canEdit.value) return
  const defaultItems = [
    // 重要證件
    { category: '重要證件', name: '護照' },
    { category: '重要證件', name: '電子簽證' },
    { category: '重要證件', name: '數位疫苗證明' },
    { category: '重要證件', name: '信用卡' },
    { category: '重要證件', name: '外幣' },
    { category: '重要證件', name: '國際駕照' },
    // 衣物類
    { category: '衣物類', name: '白天要穿的衣服' },
    { category: '衣物類', name: '內衣褲' },
    { category: '衣物類', name: '泳衣泳褲' },
    { category: '衣物類', name: '遮陽帽' },
    { category: '衣物類', name: '太陽眼鏡' },
    { category: '衣物類', name: '拖鞋' },
    { category: '衣物類', name: '襪子' },
    { category: '衣物類', name: '睡衣' },
    { category: '衣物類', name: '禦寒衣物' },
    { category: '衣物類', name: '手套/帽子/圍巾/發熱衣等' },
    // 3C 物品
    { category: '3C 物品', name: '手機' },
    { category: '3C 物品', name: '行動電源' },
    { category: '3C 物品', name: '手機充電器' },
    { category: '3C 物品', name: '萬用插頭' },
    { category: '3C 物品', name: '自拍棒' },
    { category: '3C 物品', name: 'Wi-Fi 分享器/上網卡' },
    { category: '3C 物品', name: '耳機' },
    { category: '3C 物品', name: '筆電' },
    // 日常、盥洗用品
    { category: '日常、盥洗用品', name: '洗面乳/牙刷/牙膏/毛巾/沐浴乳/洗髮精' },
    { category: '日常、盥洗用品', name: '化妝水/乳液/化妝棉/護唇膏' },
    { category: '日常、盥洗用品', name: '隱形眼鏡/眼鏡' },
    { category: '日常、盥洗用品', name: '防曬油/防蚊液' },
    { category: '日常、盥洗用品', name: '衛生紙/濕紙巾/手帕/衛生棉' },
    { category: '日常、盥洗用品', name: '腸胃藥/過敏藥/止痛藥/感冒藥' },
    { category: '日常、盥洗用品', name: '口罩' },
    { category: '日常、盥洗用品', name: '梳子' },
    { category: '日常、盥洗用品', name: '刮鬍刀(男)' },
    { category: '日常、盥洗用品', name: '隨身鏡子' },
    // 其他物品
    { category: '其他物品', name: '錢包/鑰匙' },
    { category: '其他物品', name: '水瓶或保溫瓶' },
    { category: '其他物品', name: '筆' },
    { category: '其他物品', name: '行李秤' },
    { category: '其他物品', name: '塑膠袋' },
    { category: '其他物品', name: '環保餐具' },
    { category: '其他物品', name: '雨傘' },
    { category: '其他物品', name: '酒精噴瓶' }
  ].map(item => ({ ...item, tripId: props.tripId }))

  try {
    await authFetch('/api/luggage', {
      method: 'POST',
      body: defaultItems
    })
    await refresh()
  } catch (error) {
    alert('載入預設清單失敗')
  }
}

const addItem = async (category: string) => {
  if (!canEdit.value || !newItemNames.value[category]?.trim()) return
  try {
    await authFetch('/api/luggage', {
      method: 'POST',
      body: { 
        name: newItemNames.value[category].trim(), 
        category,
        tripId: props.tripId
      }
    })
    newItemNames.value[category] = ''
    await refresh()
  } catch (error) {
    alert('新增失敗')
  }
}

const toggleItem = async (item: any) => {
  if (!canEdit.value) return
  // Optimistic UI update
  item.isCompleted = !item.isCompleted
  try {
    await authFetch(`/api/luggage/${item.id}`, {
      method: 'PUT',
      body: { isCompleted: item.isCompleted }
    })
  } catch (error) {
    item.isCompleted = !item.isCompleted
    alert('更新失敗')
  }
}

const deleteItem = async (itemId: string) => {
  if (!canEdit.value) return
  if (!confirm('確定要刪除這個物品嗎？')) return
  try {
    await authFetch(`/api/luggage/${itemId}`, { method: 'DELETE' })
    await refresh()
  } catch (err) {
    alert('刪除失敗')
  }
}
</script>

<style lang="scss" scoped>
.packing-list-tab {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 { margin: 0; font-size: 1.5rem; color: #3c2f23; }
    .add-btn {
      background: #fa8a3e; color: white; border: none; padding: 0.5rem 1rem;
      border-radius: 999px; font-weight: bold; cursor: pointer;
      box-shadow: 0 4px 6px rgba(250, 138, 62, 0.3);
      transition: transform 0.2s;
      &:hover { transform: translateY(-2px); }
      &:disabled { background: #d1d5db; cursor: not-allowed; transform: none; box-shadow: none; }
    }
  }

  .empty-state {
    text-align: center; color: #6b7280; padding: 3rem 0;
  }

  .place-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .place-card {
    background: white; border-radius: 1rem; padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    display: flex; flex-direction: column;

    .card-header {
      margin-bottom: 1rem;
      h3 { margin: 0; font-size: 1.25rem; color: #374151; }
    }

    .items-section {
      flex: 1; display: flex; flex-direction: column; gap: 1rem;
      .items-list {
        list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;
        .item-row {
          display: flex; justify-content: space-between; align-items: center;
          background: #f9fafb; padding: 0.5rem 0.75rem; border-radius: 0.5rem;
          .checkbox-label {
            display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex: 1;
            input[type="checkbox"] { width: 1.1rem; height: 1.1rem; accent-color: #9FAF64; }
            .completed { text-decoration: line-through; color: #9ca3af; }
          }
          .delete-item-btn {
            background: none; border: none; color: #ef4444; font-size: 1rem;
            cursor: pointer; opacity: 0.5; transition: opacity 0.2s;
            &:hover { opacity: 1; }
            &:disabled { cursor: not-allowed; }
          }
        }
      }

      .add-item-form {
        display: flex; gap: 0.5rem; margin-top: auto;
        input {
          flex: 1; padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;
          outline: none; transition: border-color 0.2s;
          &:focus { border-color: #9FAF64; }
          &:disabled { background: #f3f4f6; cursor: not-allowed; }
        }
        button {
          background: #9FAF64; color: white; border: none; width: 2.25rem; height: 2.25rem;
          border-radius: 0.5rem; font-weight: bold; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          &:disabled { background: #d1d5db; cursor: not-allowed; }
        }
      }
    }
  }
}
</style>
