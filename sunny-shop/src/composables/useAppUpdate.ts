import { ref } from 'vue'

const updateAvailable = ref(false)
let registration: ServiceWorkerRegistration | null = null

export function useAppUpdate() {
  function init() {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(reg => {
      registration = reg

      // New SW is waiting — update is ready
      if (reg.waiting) {
        updateAvailable.value = true
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            updateAvailable.value = true
          }
        })
      })
    })

    // When new SW takes control — reload the page
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }

  function applyUpdate() {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  return { updateAvailable, init, applyUpdate }
}
