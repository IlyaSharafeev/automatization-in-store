import { useDeviceMotion, useVibrate } from '@vueuse/core'
import { watch, ref } from 'vue'

export function useShake(threshold = 25, cooldown = 2000) {
  const { acceleration } = useDeviceMotion()
  const { vibrate } = useVibrate()
  const shakeDetected = ref(false)
  let lastShake = 0

  watch(acceleration, (a) => {
    if (!a) return
    const force = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0)
    const now = Date.now()
    if (force > threshold && now - lastShake > cooldown) {
      lastShake = now
      vibrate([50, 100, 50])
      shakeDetected.value = true
      setTimeout(() => { shakeDetected.value = false }, 100)
    }
  })

  return { shakeDetected }
}
