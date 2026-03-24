<script setup lang="ts">
import { computed } from 'vue'
import { useProductsStore, type Store } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import ProductRow from './ProductRow.vue'
import AddProductForm from './AddProductForm.vue'

const props = defineProps<{
  store: Store
}>()

const productsStore = useProductsStore()
const sessionStore = useSessionStore()

const products = computed(() => productsStore.productsByStore.get(props.store.id) ?? [])

// Checked items sink to bottom; unchecked stay at top
const sortedProducts = computed(() => {
  return [...products.value].sort((a, b) => {
    const aChecked = sessionStore.isChecked(a.id) ? 1 : 0
    const bChecked = sessionStore.isChecked(b.id) ? 1 : 0
    return aChecked - bChecked
  })
})

function handleDelete(id: string) {
  productsStore.deleteProduct(id)
}
</script>

<template>
  <section class="store-section">
    <TransitionGroup name="sink" tag="div" class="product-list">
      <ProductRow
        v-for="product in sortedProducts"
        :key="product.id"
        :product="product"
        @delete="handleDelete"
      />
    </TransitionGroup>

    <AddProductForm :storeId="store.id" />
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
  position: relative; /* needed for sink-leave-active: position absolute */
}

/* ── Sink transition ── */
.sink-move {
  transition: transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.sink-enter-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.sink-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.sink-leave-active {
  transition: opacity 150ms ease;
  position: absolute;
  width: 100%;
}

.sink-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sink-move,
  .sink-enter-active,
  .sink-leave-active {
    transition: none;
  }
}
</style>
