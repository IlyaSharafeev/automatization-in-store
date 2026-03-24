import { ref } from 'vue'

export function useLongPress(callback: () => void, duration = 500) {
  const timer = ref<ReturnType<typeof setTimeout> | null>(null)
  const triggered = ref(false)

  function start(event: MouseEvent | TouchEvent) {
    triggered.value = false
    timer.value = setTimeout(() => {
      triggered.value = true
      callback()
    }, duration)
  }

  function cancel() {
    if (timer.value !== null) {
      clearTimeout(timer.value)
      timer.value = null
    }
  }

  function end(event: MouseEvent | TouchEvent) {
    cancel()
  }

  return {
    triggered,
    handlers: {
      onMousedown: start,
      onMouseup: end,
      onMouseleave: cancel,
      onTouchstart: start,
      onTouchend: end,
      onTouchcancel: cancel,
    },
  }
}
