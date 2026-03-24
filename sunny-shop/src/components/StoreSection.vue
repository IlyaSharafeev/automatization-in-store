<script setup lang="ts">
import { computed } from 'vue'
import { useProductsStore, type Store } from '@/stores/products'
import ProductRow from './ProductRow.vue'
import AddProductForm from './AddProductForm.vue'

const props = defineProps<{
  store: Store
}>()

const productsStore = useProductsStore()

const products = computed(() => productsStore.productsByStore.get(props.store.id) ?? [])

function handleDelete(id: string) {
  productsStore.deleteProduct(id)
}
</script>

<template>
  <section class="store-section">
    <div class="product-list">
      <ProductRow
        v-for="product in products"
        :key="product.id"
        :product="product"
        @delete="handleDelete"
      />
    </div>

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
}
</style>
