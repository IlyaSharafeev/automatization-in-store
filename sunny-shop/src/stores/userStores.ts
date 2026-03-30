import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useStorage } from '@/composables/useStorage'
import { useApi } from '@/composables/useApi'

export interface UserStore {
  id: string
  name: string
  color: string
  emoji: string
  visible: boolean
  position: number
  isDefault: boolean
}

const DEFAULT_STORES: UserStore[] = [
  { id: 'zhanet',  name: 'Жанет',         color: '#e91e63', emoji: '🌸', visible: true, position: 0, isDefault: true },
  { id: 'lidl',    name: 'Лідл',          color: '#1565c0', emoji: '🔵', visible: true, position: 1, isDefault: true },
  { id: 'mladost', name: 'Младост',       color: '#2e7d32', emoji: '🌿', visible: true, position: 2, isDefault: true },
  { id: 'sklad',   name: 'Склад Младост', color: '#6d4c41', emoji: '📦', visible: true, position: 3, isDefault: true },
  { id: 'any',     name: 'Будь-який',     color: '#757575', emoji: '🏪', visible: true, position: 4, isDefault: true },
]

export const PRESET_COLORS = [
  '#e91e63', '#f44336', '#ff9800', '#ffc107',
  '#4caf50', '#2e7d32', '#1565c0', '#9c27b0',
  '#00bcd4', '#607d8b', '#6d4c41', '#757575',
]

export const EMOJI_OPTIONS = [
  '🏪', '🛒', '🌸', '🌿', '📦', '🏬', '🌊', '🍎',
  '🥩', '🧴', '💊', '🍕', '🧺', '🏷️', '⭐', '🌻',
]

function mergeWithDefaults(saved: UserStore[]): UserStore[] {
  const ids = new Set(saved.map(s => s.id))
  const maxPos = saved.reduce((m, s) => Math.max(m, s.position), -1)
  const newDefaults = DEFAULT_STORES
    .filter(d => !ids.has(d.id))
    .map((d, i) => ({ ...d, position: maxPos + 1 + i }))
  return [...saved, ...newDefaults]
}

export const useStoresStore = defineStore('userStores', () => {
  const storage = useStorage()
  const api = useApi()

  function getInitial(): UserStore[] {
    const saved = storage.get<UserStore[]>('userStores')
    if (!saved) return DEFAULT_STORES.map(d => ({ ...d }))
    return mergeWithDefaults(saved)
  }

  const stores = ref<UserStore[]>(getInitial())

  const visibleStores = computed(() =>
    [...stores.value].filter(s => s.visible).sort((a, b) => a.position - b.position)
  )

  const allSorted = computed(() =>
    [...stores.value].sort((a, b) => a.position - b.position)
  )

  function persist() {
    storage.set('userStores', stores.value)
  }

  // ── Server sync (debounced 1.5s) ──────────────────────────────────
  const syncToServer = useDebounceFn(async () => {
    const { useAuthStore } = await import('./auth')
    if (!useAuthStore().isLoggedIn) return
    try {
      await api.patch('/api/settings', {
        storesConfig: JSON.stringify(stores.value),
      })
    } catch {
      // offline — ignore
    }
  }, 1500)

  async function fetchFromServer() {
    try {
      const data = await api.get<{ storesConfig?: string | null }>('/api/settings')
      if (!data?.storesConfig) return

      const parsed = JSON.parse(data.storesConfig) as UserStore[]
      if (!Array.isArray(parsed) || parsed.length === 0) return

      // Server is source of truth; also ensure new defaults are present
      stores.value = mergeWithDefaults(parsed)
      persist()
    } catch {
      // offline or malformed — ignore
    }
  }

  function resetToDefaults() {
    stores.value = DEFAULT_STORES.map(d => ({ ...d }))
    storage.set('userStores', stores.value)
  }

  // ── Mutations (persist locally + schedule server sync) ────────────
  function toggleVisibility(id: string) {
    const s = stores.value.find(s => s.id === id)
    if (s) { s.visible = !s.visible; persist(); syncToServer() }
  }

  function rename(id: string, name: string) {
    const s = stores.value.find(s => s.id === id)
    if (s && name.trim()) { s.name = name.trim(); persist(); syncToServer() }
  }

  function updateColor(id: string, color: string) {
    const s = stores.value.find(s => s.id === id)
    if (s) { s.color = color; persist(); syncToServer() }
  }

  function updateEmoji(id: string, emoji: string) {
    const s = stores.value.find(s => s.id === id)
    if (s) { s.emoji = emoji; persist(); syncToServer() }
  }

  function deleteStore(id: string) {
    const idx = stores.value.findIndex(s => s.id === id && !s.isDefault)
    if (idx !== -1) { stores.value.splice(idx, 1); persist(); syncToServer() }
  }

  function addStore(name: string, color: string, emoji: string): string {
    const id = `custom-${Date.now()}`
    const maxPos = stores.value.reduce((m, s) => Math.max(m, s.position), -1)
    stores.value.push({
      id,
      name: name.trim(),
      color,
      emoji,
      visible: true,
      position: maxPos + 1,
      isDefault: false,
    })
    persist()
    syncToServer()
    return id
  }

  function reorder(newOrder: string[]) {
    newOrder.forEach((id, idx) => {
      const s = stores.value.find(s => s.id === id)
      if (s) s.position = idx
    })
    persist()
    syncToServer()
  }

  function getById(id: string): UserStore | undefined {
    return stores.value.find(s => s.id === id)
  }

  return {
    stores,
    visibleStores,
    allSorted,
    toggleVisibility,
    rename,
    updateColor,
    updateEmoji,
    deleteStore,
    addStore,
    reorder,
    getById,
    fetchFromServer,
    resetToDefaults,
  }
})
