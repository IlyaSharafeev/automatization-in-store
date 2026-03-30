<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProductsStore, type Store, type Product } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'
import { useI18nStore } from '@/stores/i18n'
import ProductRow from './ProductRow.vue'

const props = defineProps<{
  store: Store
  sortMode: 'default' | 'alpha' | 'frequency'
}>()

const productsStore = useProductsStore()
const sessionStore = useSessionStore()
const historyStore = useHistoryStore()
const i18n = useI18nStore()

const checkedExpanded = ref(true)

const products = computed(() => productsStore.productsByStore.get(props.store.id) ?? [])

function applySort(arr: Product[]): Product[] {
  if (props.sortMode === 'alpha') {
    return [...arr].sort((a, b) => a.name.localeCompare(b.name, 'uk'))
  }
  if (props.sortMode === 'frequency') {
    const freq = historyStore.getFrequentProductIds(999)
    return [...arr].sort((a, b) => {
      const ai = freq.indexOf(a.id)
      const bi = freq.indexOf(b.id)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  }
  return arr
}

// Unchecked items stay in place at top
const uncheckedProducts = computed(() =>
  applySort(products.value.filter(p => !sessionStore.isChecked(p.id)))
)

// Checked items in a separate collapsible section
const checkedProducts = computed(() =>
  applySort(products.value.filter(p => sessionStore.isChecked(p.id)))
)

const checkedCount = computed(() => checkedProducts.value.length)

function handleDelete(id: string) {
  productsStore.deleteProduct(id)
}
</script>

<template>
  <section class="store-section">
    <div v-if="products.length === 0" class="empty-store">
      <p>{{ i18n.t('store.empty') }}</p>
    </div>

    <!-- Unchecked products — stable position, no reordering -->
    <TransitionGroup name="row-enter" tag="div" class="product-list">
      <ProductRow
        v-for="product in uncheckedProducts"
        :key="product.id"
        :product="product"
        @delete="handleDelete"
      />
    </TransitionGroup>

    <p v-if="products.length > 0 && checkedCount === 0" class="store-hint">
      {{ i18n.t('store.hint') }}
    </p>

    <!-- Checked products — collapsible "Куплено" section -->
    <template v-if="checkedCount > 0">
      <div class="checked-section-header" @click="checkedExpanded = !checkedExpanded">
        <span class="checked-section-label">✓ Куплено ({{ checkedCount }})</span>
        <span class="checked-chevron" :class="{ open: checkedExpanded }">›</span>
      </div>

      <Transition name="expand">
        <div v-if="checkedExpanded">
          <TransitionGroup name="row-enter" tag="div" class="product-list">
            <ProductRow
              v-for="product in checkedProducts"
              :key="product.id"
              :product="product"
              @delete="handleDelete"
            />
          </TransitionGroup>
        </div>
      </Transition>
    </template>
  </section>
</template>

<style scoped>
.store-section {
  background: var(--card);
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}

.product-list {
  background: var(--card);
  position: relative;
}

/* Checked section header */
.checked-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  min-height: 36px;
}

.checked-section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: 0.03em;
}

.checked-chevron {
  font-size: 18px;
  color: var(--muted);
  transition: transform 200ms ease;
  transform: rotate(0deg);
}

.checked-chevron.open {
  transform: rotate(90deg);
}

/* Row enter animation (no reorder animation needed) */
.row-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.row-leave-active {
  transition: opacity 150ms ease;
  position: absolute;
  width: 100%;
}

.row-leave-to {
  opacity: 0;
}

/* Expand/collapse for checked section */
.expand-enter-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  max-height: 2000px;
  overflow: hidden;
}
.expand-leave-active {
  transition: max-height 200ms ease, opacity 150ms ease;
  max-height: 2000px;
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

.empty-store {
  padding: 32px 16px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.store-hint {
  padding: 8px 16px 4px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
  .row-enter-active,
  .row-leave-active,
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }
}
</style>
