import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@/composables/useStorage'
import { useHistoryStore, type CheckedItem, type ShoppingSession } from './history'

export const useSessionStore = defineStore('session', () => {
  const storage = useStorage()

  const checkedItems = ref<CheckedItem[]>(storage.get<CheckedItem[]>('session') ?? [])

  function persist() {
    storage.set('session', checkedItems.value)
  }

  function toggle(productId: string) {
    const idx = checkedItems.value.findIndex(i => i.productId === productId)
    if (idx === -1) {
      checkedItems.value.push({ productId, quantity: 1 })
    } else {
      checkedItems.value.splice(idx, 1)
    }
    persist()
  }

  function updateQty(productId: string, quantity: number) {
    const idx = checkedItems.value.findIndex(i => i.productId === productId)
    if (quantity <= 0) {
      if (idx !== -1) checkedItems.value.splice(idx, 1)
    } else {
      if (idx !== -1) { const item = checkedItems.value[idx]; if (item) item.quantity = quantity }
      else checkedItems.value.push({ productId, quantity })
    }
    persist()
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
  }

  function clearCurrent() {
    checkedItems.value = []
    persist()
  }

  const isChecked = computed(() => (productId: string): boolean => {
    return checkedItems.value.some(i => i.productId === productId)
  })

  const getQty = computed(() => (productId: string): number => {
    return checkedItems.value.find(i => i.productId === productId)?.quantity ?? 1
  })

  const checkedCount = computed(() => checkedItems.value.length)

  return { checkedItems, toggle, updateQty, finishSession, clearCurrent, isChecked, getQty, checkedCount }
})
