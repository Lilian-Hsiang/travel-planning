type ToastType = 'info' | 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

const TOAST_DURATION = 3200

export const useToast = () => {
  const toasts = useState<ToastItem[]>('toast-items', () => [])
  let idCounter = toasts.value.length ? Math.max(...toasts.value.map((t) => t.id)) : 0

  const push = (message: string, type: ToastType = 'info') => {
    if (!process.client) return
    idCounter += 1
    const id = idCounter
    toasts.value = [...toasts.value, { id, message, type }]
    setTimeout(() => {
      remove(id)
    }, TOAST_DURATION)
  }

  const remove = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, remove }
}
