import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@/composables/useStorage'
import uk from '@/i18n/uk'
import ru from '@/i18n/ru'

type Locale = 'uk' | 'ru'

export const useI18nStore = defineStore('i18n', () => {
  const storage = useStorage()
  const locale = ref<Locale>((storage.get<Locale>('locale')) ?? 'uk')

  function setLocale(l: Locale) {
    locale.value = l
    storage.set('locale', l)
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const map = locale.value === 'uk' ? uk : ru
    let str = map[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  return { locale, setLocale, t }
})
