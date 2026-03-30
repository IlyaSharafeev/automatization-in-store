import { ref } from 'vue'
import { useStorage } from './useStorage'

const storage = useStorage()
const CACHE_KEY = 'exchange_rates_cache'
const CACHE_TTL = 3_600_000 // 1 hour

interface RatesCache {
  rates: { EUR: number; USD: number }
  fetchedAt: number
}

// Module-level so rates are shared across components
const rates = ref<{ EUR: number; USD: number }>({ EUR: 0.024, USD: 0.025 })
let _fetched = false

export function useExchangeRates() {
  async function fetchRates() {
    if (_fetched) return
    _fetched = true

    const cached = storage.get<RatesCache>(CACHE_KEY)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      rates.value = cached.rates
      return
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/UAH')
      const data = await res.json()
      if (data?.rates?.EUR && data?.rates?.USD) {
        rates.value = { EUR: data.rates.EUR, USD: data.rates.USD }
        storage.set(CACHE_KEY, { rates: rates.value, fetchedAt: Date.now() } as RatesCache)
      }
    } catch {
      if (cached) rates.value = cached.rates
    }
  }

  return { rates, fetchRates }
}
