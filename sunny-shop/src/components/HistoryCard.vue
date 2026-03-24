<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductsStore, STORES } from '@/stores/products'
import { useI18nStore } from '@/stores/i18n'
import type { ShoppingSession } from '@/stores/history'

const props = defineProps<{
  session: ShoppingSession
}>()

const productsStore = useProductsStore()
const i18n = useI18nStore()

const expanded = ref(false)

const formattedDate = computed(() => {
  const d = new Date(props.session.date)
  const dd = String(d.getDate()).padStart(2, '0')
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${MM}.${yyyy} ${HH}:${mm}`
})

const itemsByStore = computed(() => {
  const result: Array<{ store: typeof STORES[0], items: Array<{ name: string; qty: number; unit: string }> }> = []
  for (const store of STORES) {
    const storeItems = props.session.items.flatMap(ci => {
      const product = productsStore.products.find(p => p.id === ci.productId)
      if (!product || product.storeId !== store.id) return []
      return [{ name: product.name, qty: ci.quantity, unit: product.unit }]
    })
    if (storeItems.length > 0) {
      result.push({ store, items: storeItems })
    }
  }
  return result
})
</script>

<template>
  <div class="history-card">
    <button class="card-header" @click="expanded = !expanded">
      <div class="header-left">
        <span class="date">{{ formattedDate }}</span>
        <span class="count">{{ i18n.t('history.items', { n: session.items.length }) }}</span>
      </div>
      <span class="chevron" :class="{ open: expanded }">›</span>
    </button>

    <Transition name="expand">
      <div v-if="expanded" class="card-body">
        <div v-for="group in itemsByStore" :key="group.store.id" class="store-group">
          <div class="store-label" :style="{ color: group.store.color }">{{ group.store.name }}</div>
          <div v-for="item in group.items" :key="item.name" class="item-line">
            {{ item.name }} × {{ item.qty }} {{ i18n.t(`unit.${item.unit}`) }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.history-card {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  margin-bottom: 8px;
}

.card-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  min-height: 56px;
  text-align: left;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.count {
  font-size: 12px;
  color: var(--muted);
}

.chevron {
  font-size: 22px;
  color: var(--muted);
  transition: transform 200ms ease;
  transform: rotate(0deg);
}

.chevron.open {
  transform: rotate(90deg);
}

.card-body {
  padding: 0 16px 14px;
  border-top: 1px solid var(--border);
}

.store-group {
  margin-top: 12px;
}

.store-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.item-line {
  font-size: 14px;
  color: var(--text);
  padding: 2px 0;
}

.expand-enter-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  max-height: 600px;
  overflow: hidden;
}
.expand-leave-active {
  transition: max-height 200ms ease, opacity 150ms ease;
  max-height: 600px;
  overflow: hidden;
}
.expand-enter-from {
  max-height: 0;
  opacity: 0;
}
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
