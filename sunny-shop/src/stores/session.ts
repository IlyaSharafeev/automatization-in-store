import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useStorage } from '@/composables/useStorage'
import { useApi } from '@/composables/useApi'
import { useHistoryStore, type CheckedItem, type ShoppingSession } from './history'
import { useSyncStatus } from '@/composables/useSyncStatus'

const { setSyncing, setSynced, setError } = useSyncStatus()

// WS handlers set by useShareSession when connected
type WsHandlers = {
  toggle: (productId: string, price: number) => void
  setQty: (productId: string, qty: number) => void
  setPrice: (productId: string, price: number) => void
  clear: () => void
}
let _wsHandlers: WsHandlers | null = null

export function setSessionWsHandlers(h: WsHandlers | null) {
  _wsHandlers = h
}

export const useSessionStore = defineStore('session', () => {
  const storage = useStorage()
  const api = useApi()

  const checkedItems = ref<CheckedItem[]>(storage.get<CheckedItem[]>('session') ?? [])

  function persist() {
    storage.set('session', checkedItems.value)
  }

  const syncToServer = useDebounceFn(async () => {
    const { useAuthStore } = await import('./auth')
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) return

    const items = checkedItems.value.map(i => ({
      productClientId: i.productId,
      quantity: i.quantity,
      price: i.price ?? 0,
    }))

    setSyncing()
    try {
      await api.put('/api/session', { items }, true)
      setSynced()
    } catch {
      setError()
    }
  }, 2000)

  async function fetchFromServer() {
    try {
      const data = await api.get<{ items: { productClientId: string; quantity: number; price: number }[] }>('/api/session')
      if (!data) return
      checkedItems.value = data.items.map(i => ({ productId: i.productClientId, quantity: i.quantity, price: i.price ?? 0 }))
      persist()
    } catch {
      // offline — ignore
    }
  }

  function toggle(productId: string) {
    if (_wsHandlers) {
      const price = checkedItems.value.find(i => i.productId === productId)?.price ?? 0
      _wsHandlers.toggle(productId, price)
      return
    }
    const idx = checkedItems.value.findIndex(i => i.productId === productId)
    if (idx === -1) {
      checkedItems.value.push({ productId, quantity: 1 })
    } else {
      checkedItems.value.splice(idx, 1)
    }
    persist()
    syncToServer()
  }

  function updateQty(productId: string, quantity: number) {
    if (_wsHandlers) {
      _wsHandlers.setQty(productId, quantity)
      return
    }
    const idx = checkedItems.value.findIndex(i => i.productId === productId)
    if (quantity <= 0) {
      if (idx !== -1) checkedItems.value.splice(idx, 1)
    } else {
      if (idx !== -1) { const item = checkedItems.value[idx]; if (item) item.quantity = quantity }
      else checkedItems.value.push({ productId, quantity })
    }
    persist()
    syncToServer()
  }

  function updatePrice(productId: string, price: number) {
    if (_wsHandlers) {
      _wsHandlers.setPrice(productId, price)
      return
    }
    const item = checkedItems.value.find(i => i.productId === productId)
    if (item) {
      item.price = price >= 0 ? price : 0
      persist()
      syncToServer()
    }
  }

  function finishSession() {
    const historyStore = useHistoryStore()
    const session: ShoppingSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...checkedItems.value.map(i => ({ ...i }))],
    }
    historyStore.addSession(session)
    checkedItems.value = []
    persist()
    syncToServer()
  }

  function clearCurrent() {
    if (_wsHandlers) {
      _wsHandlers.clear()
      return
    }
    checkedItems.value = []
    persist()
    syncToServer()
  }

  function loadFromSession(items: CheckedItem[]) {
    checkedItems.value = items.map(item => ({ ...item }))
    persist()
    syncToServer()
  }

  const isChecked = computed(() => (productId: string): boolean => {
    return checkedItems.value.some(i => i.productId === productId)
  })

  const getQty = computed(() => (productId: string): number => {
    return checkedItems.value.find(i => i.productId === productId)?.quantity ?? 1
  })

  const checkedCount = computed(() => checkedItems.value.length)

  const totalCost = computed(() =>
    checkedItems.value.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
  )

  const getPrice = computed(() => (productId: string): number =>
    checkedItems.value.find(i => i.productId === productId)?.price ?? 0
  )

  // ── Shared mode ───────────────────────────────────────────────────
  const isSharedMode = ref(false)
  const _ownItems = ref<CheckedItem[]>([])

  function enterSharedMode(sharedItems: { productClientId: string; quantity: number; price: number }[]) {
    if (!isSharedMode.value) {
      _ownItems.value = [...checkedItems.value]
      isSharedMode.value = true
    }
    checkedItems.value = sharedItems.map(i => ({
      productId: i.productClientId,
      quantity: i.quantity,
      price: i.price,
    }))
  }

  function exitSharedMode() {
    if (isSharedMode.value) {
      checkedItems.value = [..._ownItems.value]
      _ownItems.value = []
      isSharedMode.value = false
      persist()
    }
  }

  return { checkedItems, toggle, updateQty, updatePrice, finishSession, clearCurrent, loadFromSession, fetchFromServer, isChecked, getQty, getPrice, checkedCount, totalCost, isSharedMode, enterSharedMode, exitSharedMode }
})
