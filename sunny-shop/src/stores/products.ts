import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@/composables/useStorage'

export type StoreId = 'zhanet' | 'lidl' | 'mladost' | 'any'
export type Unit = 'кг' | 'л' | 'шт' | 'г' | 'пач' | 'бан' | '—'

export interface Store {
  id: StoreId
  name: string
  color: string
}

export interface Product {
  id: string
  name: string
  storeId: StoreId
  unit: Unit
  isCustom: boolean
  isReminder?: boolean
}

export const STORES: Store[] = [
  { id: 'zhanet',  name: 'Жанет',     color: '#e91e63' },
  { id: 'lidl',    name: 'Лідл',      color: '#1565c0' },
  { id: 'mladost', name: 'Младост',   color: '#2e7d32' },
  { id: 'any',     name: 'Будь-який', color: '#757575' },
]

const SEED_PRODUCTS: Product[] = [
  // Жанет
  { id: 'zh-01', name: "М'ясо фарш",          storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-02', name: 'Куряча грудка',        storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-03', name: "М'ясо шматок",         storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-04', name: 'Крила курячі',         storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-05', name: 'Ковбаса паличка',      storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-06', name: 'Крабові палички',      storeId: 'zhanet', unit: 'пач', isCustom: false },
  { id: 'zh-07', name: 'Сир',                  storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-08', name: 'Плавлені сирки',       storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-09', name: 'Яйця',                 storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-10', name: 'Творог',               storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-11', name: 'Булочка',              storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-12', name: 'Кебаб',               storeId: 'zhanet', unit: 'шт', isCustom: false },
  { id: 'zh-13', name: 'Помідори',             storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-14', name: 'Огірки',               storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-15', name: 'Перець болгарський',   storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-16', name: 'Мариновані огірки',    storeId: 'zhanet', unit: 'бан', isCustom: false },
  { id: 'zh-17', name: 'Зелень',               storeId: 'zhanet', unit: 'пач', isCustom: false },
  { id: 'zh-18', name: 'Гриби',                storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-19', name: 'Буряк',                storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-20', name: 'Морква',               storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-21', name: 'Цибуля',               storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-22', name: 'Картопля',             storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-23', name: 'Яблука',               storeId: 'zhanet', unit: 'кг',  isCustom: false },
  { id: 'zh-24', name: 'Швепс / Напої',        storeId: 'zhanet', unit: 'л',   isCustom: false },
  { id: 'zh-25', name: 'Алкоголь',             storeId: 'zhanet', unit: 'шт', isCustom: false },
  // Лідл
  { id: 'li-01', name: 'Хліб',                 storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-02', name: 'Молоко',               storeId: 'lidl', unit: 'л',   isCustom: false },
  { id: 'li-03', name: 'Масло вершкове',       storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-04', name: 'Пончики',              storeId: 'lidl', unit: 'пач', isCustom: false },
  { id: 'li-05', name: 'Макарони',             storeId: 'lidl', unit: 'пач', isCustom: false },
  { id: 'li-06', name: 'Рис',                  storeId: 'lidl', unit: 'кг',  isCustom: false },
  { id: 'li-07', name: 'Борошно',              storeId: 'lidl', unit: 'кг',  isCustom: false },
  { id: 'li-08', name: 'Цукор',                storeId: 'lidl', unit: 'кг',  isCustom: false },
  { id: 'li-09', name: 'Сіль',                 storeId: 'lidl', unit: 'пач', isCustom: false },
  { id: 'li-10', name: 'Олія соняшникова',     storeId: 'lidl', unit: 'л',   isCustom: false },
  { id: 'li-11', name: 'Майонез',              storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-12', name: 'Соус',                 storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-13', name: 'Тунець',               storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-14', name: 'Лаваш',                storeId: 'lidl', unit: 'шт',  isCustom: false },
  { id: 'li-15', name: 'Хлопья / Мюслі',      storeId: 'lidl', unit: 'пач', isCustom: false },
  { id: 'li-16', name: 'Чіпси',                storeId: 'lidl', unit: 'пач', isCustom: false },
  { id: 'li-17', name: 'Акційна полка ⭐',     storeId: 'lidl', unit: '—',   isCustom: false, isReminder: true },
  // Младост
  { id: 'ml-01', name: 'Апельсини',            storeId: 'mladost', unit: 'кг',  isCustom: false },
  { id: 'ml-02', name: 'Банани',               storeId: 'mladost', unit: 'кг',  isCustom: false },
  { id: 'ml-03', name: 'Норі',                 storeId: 'mladost', unit: 'пач', isCustom: false },
  { id: 'ml-04', name: 'Крючки (снеки)',       storeId: 'mladost', unit: 'пач', isCustom: false },
  { id: 'ml-05', name: 'Желейні цукерки',      storeId: 'mladost', unit: 'пач', isCustom: false },
  { id: 'ml-06', name: 'Чай',                  storeId: 'mladost', unit: 'пач', isCustom: false },
  { id: 'ml-07', name: 'Мед',                  storeId: 'mladost', unit: 'шт',  isCustom: false },
  { id: 'ml-08', name: 'Соус ягідний',         storeId: 'mladost', unit: 'шт',  isCustom: false },
  // Будь-який
  { id: 'an-01', name: 'Дезодоранти',          storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-02', name: 'Презервативи',         storeId: 'any', unit: 'пач', isCustom: false },
  { id: 'an-03', name: 'Краплі для очей',      storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-04', name: 'Гель для інтиму',      storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-05', name: 'Серветки столові',     storeId: 'any', unit: 'пач', isCustom: false },
  { id: 'an-06', name: 'Кісточки для унітазу', storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-07', name: 'Полички для ванни',    storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-08', name: 'Кружка',               storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-09', name: 'Філадельфія',          storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-10', name: 'Жуйки Теніс',          storeId: 'any', unit: 'пач', isCustom: false },
  { id: 'an-11', name: 'Шоколад',              storeId: 'any', unit: 'шт',  isCustom: false },
  { id: 'an-12', name: 'Сухарики',             storeId: 'any', unit: 'пач', isCustom: false },
  { id: 'an-13', name: 'Печиво',               storeId: 'any', unit: 'пач', isCustom: false },
]

export const useProductsStore = defineStore('products', () => {
  const storage = useStorage()

  const products = ref<Product[]>(storage.get<Product[]>('products') ?? [...SEED_PRODUCTS])

  function persist() {
    storage.set('products', products.value)
  }

  function addCustomProduct(name: string, storeId: StoreId, unit: Unit) {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    products.value.push({ id, name, storeId, unit, isCustom: true })
    persist()
  }

  function deleteProduct(id: string) {
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      products.value.splice(idx, 1)
      persist()
    }
  }

  const productsByStore = computed((): Map<StoreId, Product[]> => {
    const map = new Map<StoreId, Product[]>()
    for (const store of STORES) {
      map.set(store.id, products.value.filter(p => p.storeId === store.id))
    }
    return map
  })

  return { products, addCustomProduct, deleteProduct, productsByStore }
})
