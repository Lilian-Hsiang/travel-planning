<template>
  <div class="ledger-tab">
    <div class="header">
      <div class="header-text">
        <h2>記帳 / 分帳</h2>
      </div>
      <button class="add-btn" @click="openAddModal">+ 新增記帳</button>
    </div>

    <div v-if="pending" class="empty-state">載入中...</div>
    <div v-else-if="entries.length === 0" class="empty-state">目前還沒有任何記帳紀錄，試著新增第一筆吧！</div>

    <div v-else class="ledger-grid">
      <div v-for="entry in entries" :key="entry.id" class="ledger-card">
        <div class="card-header">
          <div>
            <p class="item-label">{{ entry.itemName }}</p>
            <p class="amount">NT$ {{ formatCurrency(entry.totalAmount) }}</p>
            <p v-if="entry.payer" class="payer">由 {{ entry.payer }} 先行支付</p>
          </div>
          <div class="card-actions">
            <button class="icon-btn" @click="openEditModal(entry)"><FontAwesomeIcon :icon="['fas', 'pen-to-square']" aria-hidden="true" /></button>
            <button class="icon-btn delete" @click="openDeleteConfirm(entry)"><FontAwesomeIcon :icon="['fas', 'trash']" aria-hidden="true" /></button>
          </div>
        </div>

        <p v-if="entry.notes" class="notes">{{ entry.notes }}</p>

        <div class="split-list">
          <div class="split-row split-head">
            <span>成員</span>
            <span>應付金額</span>
            <span>狀態</span>
          </div>
          <div v-for="split in entry.splits || []" :key="split.id" class="split-row">
            <div class="split-item">
              <span class="split-label">成員</span>
              <span class="split-name">{{ split.name }}</span>
            </div>
            <div class="split-item">
              <span class="split-label">應付金額</span>
              <span class="split-amount">NT$ {{ formatCurrency(split.amount) }}</span>
            </div>
            <div class="split-item">
              <span class="split-label">狀態</span>
              <button
                class="status-pill"
                :class="{ settled: split.isSettled }"
                @click="toggleSettlement(entry, split.id)"
              >
                {{ split.isSettled ? '已結清' : '待結清' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card-summary">
          <span>分帳總額：NT$ {{ formatCurrency(sumSplit(entry.splits)) }}</span>
          <span>尚未結清：NT$ {{ formatCurrency(unsettledTotal(entry.splits)) }}</span>
        </div>
      </div>
    </div>

    <AppModal :is-open="isModalOpen" :title="isEditing ? '編輯記帳' : '新增記帳'" @close="closeModal">
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-grid">
          <div class="form-group">
            <label>商品 / 項目名稱</label>
            <input v-model="form.itemName" type="text" required placeholder="例如：晚餐、門票" />
          </div>
          <div class="form-group">
            <label>總金額</label>
            <input v-model.number="form.totalAmount" type="number" min="0" step="1" required placeholder="0" />
          </div>
          <div class="form-group">
            <label>付款人 (選填)</label>
            <input v-model="form.payer" type="text" placeholder="誰先墊付？" />
          </div>
          <div class="form-group">
            <label>備註 (選填)</label>
            <textarea v-model="form.notes" rows="2" placeholder="輸入額外說明..."></textarea>
          </div>
        </div>

        <div class="split-editor">
          <div class="split-editor-header">
            <h4>分帳成員</h4>
            <button type="button" class="ghost-btn" @click="addSplitLine">+ 新增成員</button>
          </div>
          <div v-for="(split, index) in form.splits" :key="split.id" class="split-editor-row">
            <input v-model="split.name" type="text" placeholder="成員名稱" required />
            <input v-model.number="split.amount" type="number" min="0" step="1" placeholder="金額" required />
            <label class="settled-check">
              <input type="checkbox" v-model="split.isSettled" />
              已結清
            </label>
            <button type="button" class="remove-btn" @click="removeSplitLine(split.id)" :disabled="form.splits.length === 1">
              ✕
            </button>
          </div>
          <div class="split-summary">
            <span>成員金額合計：NT$ {{ formatCurrency(sumSplit(form.splits)) }}</span>
            <span v-if="Number(form.totalAmount)">
              與總金額差：NT$ {{ formatCurrency(Number(form.totalAmount) - sumSplit(form.splits)) }}
            </span>
          </div>
        </div>

        <button type="submit" class="submit-btn">確認儲存</button>
      </form>
    </AppModal>

    <AppModal :is-open="isDeleteModalOpen" title="刪除確認" @close="closeDeleteModal">
      <div class="delete-confirm-content">
        <p>確定要刪除「<strong>{{ deletingEntry?.itemName }}</strong>」嗎？</p>
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

type SplitLine = {
  id: string
  name: string
  amount: number
  isSettled: boolean
}

type LedgerForm = {
  itemName: string
  totalAmount: number | ''
  payer: string
  notes: string
  splits: SplitLine[]
}

const props = defineProps<{
  tripId: string | string[]
}>()

const { authFetch } = useAuthFetch()
const { user } = useAuth()

const { data: ledgerData, pending, refresh } = await useAsyncData(
  `ledger-${props.tripId}`,
  () => authFetch(`/api/ledger?tripId=${props.tripId}`),
  {
    server: false,
    immediate: false,
    watch: [user]
  }
)

if (user.value) {
  refresh()
}

const entries = computed(() => ledgerData.value || [])

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const generateId = () => Math.random().toString(36).substring(2, 9)

const defaultSplit = (): SplitLine => ({ id: generateId(), name: '', amount: 0, isSettled: false })
const defaultForm = (): LedgerForm => ({ itemName: '', totalAmount: '', payer: '', notes: '', splits: [defaultSplit()] })

const form = ref<LedgerForm>(defaultForm())

const isDeleteModalOpen = ref(false)
const deletingEntry = ref<any>(null)

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = defaultForm()
  isModalOpen.value = true
}

const openEditModal = (entry: any) => {
  isEditing.value = true
  editingId.value = entry.id
  form.value = {
    itemName: entry.itemName || '',
    totalAmount: typeof entry.totalAmount === 'number' ? entry.totalAmount : Number(entry.totalAmount) || '',
    payer: entry.payer || '',
    notes: entry.notes || '',
    splits: (entry.splits || []).map((split: SplitLine) => ({
      id: split.id || generateId(),
      name: split.name || '',
      amount: Number(split.amount) || 0,
      isSettled: Boolean(split.isSettled)
    }))
  }
  if (form.value.splits.length === 0) {
    form.value.splits.push(defaultSplit())
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const addSplitLine = () => {
  form.value.splits.push(defaultSplit())
}

const removeSplitLine = (splitId: string) => {
  if (form.value.splits.length === 1) return
  form.value.splits = form.value.splits.filter(split => split.id !== splitId)
}

const sumSplit = (splits: SplitLine[] = []) => {
  return splits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0)
}

const unsettledTotal = (splits: SplitLine[] = []) => {
  return splits
    .filter(split => !split.isSettled)
    .reduce((sum, split) => sum + (Number(split.amount) || 0), 0)
}

const formatCurrency = (value: number | string | undefined) => {
  const num = typeof value === 'string' ? Number(value) : value
  if (!num) return '0'
  return num.toLocaleString('zh-TW', { minimumFractionDigits: 0 })
}

const submitForm = async () => {
  const payload = {
    itemName: form.value.itemName.trim(),
    totalAmount: Number(form.value.totalAmount) || 0,
    payer: form.value.payer.trim(),
    notes: form.value.notes.trim(),
    splits: form.value.splits.map(split => ({
      id: split.id || generateId(),
      name: split.name.trim(),
      amount: Number(split.amount) || 0,
      isSettled: Boolean(split.isSettled)
    })),
    tripId: props.tripId
  }

  if (!payload.itemName) {
    alert('請輸入商品名稱')
    return
  }

  if (payload.totalAmount < 0) {
    alert('金額不可小於 0')
    return
  }

  try {
    if (isEditing.value && editingId.value) {
      await authFetch(`/api/ledger/${editingId.value}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await authFetch('/api/ledger', {
        method: 'POST',
        body: payload
      })
    }
    closeModal()
    await refresh()
  } catch (error) {
    alert('儲存記帳失敗')
  }
}

const openDeleteConfirm = (entry: any) => {
  deletingEntry.value = entry
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  deletingEntry.value = null
}

const confirmDelete = async () => {
  if (!deletingEntry.value) return
  try {
    await authFetch(`/api/ledger/${deletingEntry.value.id}`, { method: 'DELETE' })
    closeDeleteModal()
    await refresh()
  } catch (error) {
    alert('刪除記帳失敗')
  }
}

const toggleSettlement = async (entry: any, splitId: string) => {
  const updatedSplits = (entry.splits || []).map((split: SplitLine) => {
    if (split.id === splitId) {
      return { ...split, isSettled: !split.isSettled }
    }
    return split
  })

  try {
    await authFetch(`/api/ledger/${entry.id}`, {
      method: 'PUT',
      body: { splits: updatedSplits }
    })
    await refresh()
  } catch (error) {
    alert('更新狀態失敗')
  }
}

</script>

<style lang="scss" scoped>
.ledger-tab {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}

.header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;

  .header-text {
    h2 {
      margin: 0;
      font-size: 1.6rem;
      color: #3c2f23;
    }
    p {
      margin: 0.25rem 0 0;
      color: #87745f;
      font-size: 0.95rem;
    }
  }

  .add-btn {
    align-self: flex-start;
    background: #ff8a3e;
    border: none;
    color: white;
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
  padding: 3rem 1.5rem;
  color: #9ca3af;
  background: white;
  border-radius: 1.25rem;
  border: 1px dashed #d1d5db;
}

.ledger-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.ledger-card {
  background: #fffefa;
  border-radius: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 171, 92, 0.35);
  box-shadow: 0 15px 30px rgba(60, 47, 35, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;

  .item-label {
    margin: 0;
    font-size: 1rem;
    color: #7a6149;
  }

  .amount {
    margin: 0.35rem 0 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ef6b2e;
  }

  .payer {
    margin: 0.25rem 0 0;
    color: #9e8167;
    font-size: 0.875rem;
  }

  .card-actions {
    display: flex;
    gap: 0.25rem;

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
}

.notes {
  margin: 0.75rem 0 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 241, 227, 0.9);
  color: #6b4f3b;
  font-size: 0.9rem;
  min-height: 2.25rem;
}

.split-list {
  border: 1px dashed rgba(122, 97, 73, 0.3);
  border-radius: 1rem;
  padding: 0.75rem;
  background: #fff;

  .split-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    // align-items: center;
    padding: 0.5rem 0.25rem;
    font-size: 0.9rem;
    color: #574539;

    & + .split-row {
      border-top: 1px solid #f3efe8;
    }

    .split-label {
      display: none;
    }

    .split-item {
      display: contents;
    }

    .split-name {
      font-weight: 600;
    }

    .split-amount {
      color: #c26b2d;
      font-weight: 600;
    }

    .status-pill {
      border: none;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      font-size: 0.75rem;
      cursor: pointer;
      background: rgba(255, 190, 138, 0.3);
      color: #c87332;

      &.settled {
        background: rgba(111, 187, 135, 0.25);
        color: #2f7a49;
      }
    }
  }

  .split-head {
    font-size: 0.8rem;
    color: #a79281;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.card-summary {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(122, 97, 73, 0.2);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #7a6149;
}

/* Modal */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #5d4836;
  }

  input,
  textarea {
    border: 1px solid #e4d5c5;
    border-radius: 0.65rem;
    padding: 0.75rem;
    font-size: 0.95rem;
    background: #fff9f2;
  }
}

.split-editor {
  border: 1px dashed #f0d6b1;
  border-radius: 1rem;
  padding: 1rem;
  background: #fffdf8;
}

.split-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;

  h4 {
    margin: 0;
    font-size: 1rem;
    color: #7a6149;
  }

  .ghost-btn {
    border: none;
    background: none;
    color: #c87332;
    font-weight: 600;
    cursor: pointer;
  }
}

.split-editor-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr)) auto auto;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  input[type="text"],
  input[type="number"] {
    border: 1px solid #e2d4c5;
    border-radius: 0.5rem;
    padding: 0.6rem;
    background: white;
  }

  .settled-check {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.85rem;
    color: #7a6149;
  }

  .remove-btn {
    border: none;
    background: rgba(239, 75, 64, 0.15);
    color: #d33e2c;
    border-radius: 0.5rem;
    width: 36px;
    height: 36px;
    cursor: pointer;
  }
}

.split-summary {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: #7a6149;
}

.submit-btn {
  align-self: flex-end;
  background: #ff8a3e;
  color: white;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.delete-confirm-content {
  text-align: center;
  padding: 1rem 0;

  .warning-text {
    color: #d33e2c;
    margin-bottom: 1rem;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .cancel-btn {
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  .delete-btn {
    background: #fee2e2;
    color: #d33e2c;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
}

@media (max-width: 640px) {
  .split-list {
    .split-head {
      display: none !important;
    }

    .split-row {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fafaf9;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      border: none;

      &:last-child {
        margin-bottom: 0;
      }

      .split-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .split-label {
        display: block;
        font-size: 0.8rem;
        color: #a79281;
        font-weight: 600;
        min-width: 80px;
        flex-shrink: 0;
      }

      .split-name,
      .split-amount {
        flex: 1;
        text-align: left;
      }

      .status-pill {
        margin-left: 0;
      }
    }
  }

  .split-editor-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;

    .status-pill,
    .remove-btn {
      justify-self: flex-start;
    }
  }

  .card-summary {
    font-size: 0.8rem;
    gap: 0.75rem;
    
    span {
      white-space: nowrap;
    }
  }
}
</style>
