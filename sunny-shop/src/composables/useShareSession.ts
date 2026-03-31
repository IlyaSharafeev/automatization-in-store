import { ref, computed } from 'vue'
import { setSessionWsHandlers } from '@/stores/session'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const WS_URL = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

async function apiRequest<T>(method: string, path: string, body?: object): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface SharedItem {
  productClientId: string
  quantity: number
  price: number
}

export interface Participant {
  name: string
  isOwner: boolean
}

// Singleton state
const isActive = ref(false)
const isOwner = ref(false)
const shareCode = ref(localStorage.getItem('shareCode') ?? '')
const shareRole = ref<'owner' | 'guest' | ''>(
  (localStorage.getItem('shareRole') as 'owner' | 'guest' | '') ?? ''
)
const ownerName = ref('')
const participants = ref<Participant[]>([])
const items = ref<SharedItem[]>([])
const ws = ref<WebSocket | null>(null)
const error = ref('')

type OnUpdateCallback = (items: SharedItem[]) => void
let onUpdate: OnUpdateCallback | null = null

function persistShare(code: string, role: 'owner' | 'guest') {
  localStorage.setItem('shareCode', code)
  localStorage.setItem('shareRole', role)
}

function clearSharePersist() {
  localStorage.removeItem('shareCode')
  localStorage.removeItem('shareRole')
}

export function useShareSession() {
  const participantCount = computed(() => participants.value.length + 1)

  async function createShare(): Promise<string> {
    const data = await apiRequest<{ shareCode: string }>('POST', '/api/share', {})
    shareCode.value = data.shareCode
    isOwner.value = true
    return data.shareCode
  }

  async function validateCode(code: string): Promise<{ ownerName: string }> {
    return apiRequest<{ ownerName: string }>('GET', `/api/share/${code}`)
  }

  function connect(code: string, role: 'owner' | 'guest', callbacks?: { onUpdate?: OnUpdateCallback }) {
    if (callbacks?.onUpdate) onUpdate = callbacks.onUpdate

    const token = localStorage.getItem('accessToken')
    if (!token) { error.value = 'Not authenticated'; return }

    // Close existing connection
    ws.value?.close()

    const url = `${WS_URL}/ws?shareCode=${code}&token=${token}`
    const socket = new WebSocket(url)
    ws.value = socket
    shareCode.value = code
    shareRole.value = role
    isOwner.value = role === 'owner'
    persistShare(code, role)

    // Set WS handlers so sessionStore routes through WS
    setSessionWsHandlers({
      toggle: (productId, price) => send({ type: 'TOGGLE', productClientId: productId, price }),
      setQty: (productId, qty) => send({ type: 'SET_QTY', productClientId: productId, qty }),
      setPrice: (productId, price) => send({ type: 'SET_PRICE', productClientId: productId, price }),
      clear: () => send({ type: 'CLEAR' }),
    })

    socket.onopen = () => {
      isActive.value = true
      error.value = ''
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)

        if (msg.type === 'INIT') {
          ownerName.value = msg.ownerName
          participants.value = msg.participants ?? []
          items.value = msg.items ?? []
          onUpdate?.(items.value)
        } else if (msg.type === 'SESSION_UPDATE') {
          items.value = msg.items ?? []
          onUpdate?.(items.value)
        } else if (msg.type === 'MEMBER_JOIN') {
          participants.value.push({ name: msg.name, isOwner: msg.isOwner })
        } else if (msg.type === 'MEMBER_LEAVE') {
          participants.value = participants.value.filter(p => p.name !== msg.name)
        }
      } catch { /* ignore parse errors */ }
    }

    socket.onerror = () => {
      error.value = 'Помилка з\'єднання'
    }

    socket.onclose = () => {
      isActive.value = false
      participants.value = []
      setSessionWsHandlers(null)
    }
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    isActive.value = false
    isOwner.value = false
    shareCode.value = ''
    shareRole.value = ''
    ownerName.value = ''
    participants.value = []
    items.value = []
    onUpdate = null
    setSessionWsHandlers(null)
    clearSharePersist()
  }

  function send(msg: object) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(msg))
    }
  }

  async function revokeShare() {
    await apiRequest('DELETE', '/api/share')
    disconnect()
  }

  function getShareUrl(code: string): string {
    return `${window.location.origin}/?share=${code}`
  }

  // Restore connection after page refresh
  async function tryReconnect(callbacks: { onUpdate: OnUpdateCallback }): Promise<boolean> {
    const savedCode = localStorage.getItem('shareCode')
    const savedRole = localStorage.getItem('shareRole') as 'owner' | 'guest' | null
    if (!savedCode || !savedRole) return false

    try {
      await validateCode(savedCode)
      connect(savedCode, savedRole, callbacks)
      return true
    } catch {
      clearSharePersist()
      return false
    }
  }

  return {
    isActive,
    isOwner,
    shareCode,
    shareRole,
    ownerName,
    participants,
    participantCount,
    items,
    error,
    createShare,
    validateCode,
    connect,
    disconnect,
    revokeShare,
    getShareUrl,
    tryReconnect,
  }
}
