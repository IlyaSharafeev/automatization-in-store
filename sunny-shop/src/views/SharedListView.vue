<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { decodeList } from '@/composables/useShareList'
import { useProductsStore } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const sessionStore = useSessionStore()
const toast = useToast()

const imported = ref(false)

const sharedList = computed(() => {
  const d = route.query.d as string | undefined
  if (!d) return null
  return decodeList(d)
})

const groupedByStore = computed(() => {
  if (!sharedList.value) return []
  const groups = new Map<string, typeof sharedList.value.items>()
  for (const item of sharedList.value.items) {
    const key = item.s || 'Інше'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return [...groups.entries()].map(([store, items]) => ({ store, items }))
})

function handleImport() {
  if (!sharedList.value) return

  let added = 0
  for (const item of sharedList.value.items) {
    // Try to find existing product by name
    const existing = productsStore.products.find(
      p => p.name.toLowerCase() === item.n.toLowerCase()
    )
    const productId = existing?.id ?? (() => {
      productsStore.addCustomProduct(item.n, 'any', item.u as any)
      const newP = productsStore.products.find(p => p.name === item.n)
      return newP?.id
    })()

    if (productId && !sessionStore.isChecked(productId)) {
      sessionStore.toggle(productId)
      sessionStore.updateQty(productId, item.q)
      added++
    }
  }

  imported.value = true
  toast.success(`Додано ${added} товарів у поточний закуп`)
  setTimeout(() => router.push('/shopping'), 1200)
}
</script>

<template>
  <div class="shared-view">
    <header class="top-header">
      <button class="back-btn" @click="router.push('/')">‹</button>
      <span class="title">Список покупок</span>
      <span class="spacer" />
    </header>

    <main class="content">
      <!-- Invalid link -->
      <div v-if="!sharedList" class="error-state">
        <span class="error-icon">🔗</span>
        <p>Посилання недійсне або застаріло</p>
        <button class="btn-home" @click="router.push('/')">На головну</button>
      </div>

      <!-- Valid list -->
      <template v-else>
        <div class="list-meta">
          <span class="list-title">{{ sharedList.t ? `Список від ${sharedList.t}` : 'Список покупок' }}</span>
          <span class="list-count">{{ sharedList.items.length }} товарів</span>
        </div>

        <div class="store-groups">
          <div v-for="group in groupedByStore" :key="group.store" class="store-group">
            <div class="store-name">{{ group.store }}</div>
            <div
              v-for="item in group.items"
              :key="item.n"
              class="item-row"
            >
              <div class="item-checkbox">✓</div>
              <span class="item-name">{{ item.n }}</span>
              <span class="item-qty">{{ item.q }}</span>
              <span class="item-unit">{{ item.u }}</span>
            </div>
          </div>
        </div>

        <div class="import-section">
          <button
            class="btn-import"
            :disabled="imported"
            @click="handleImport"
          >
            {{ imported ? '✓ Додано до закупу' : '+ Додати у мій закуп' }}
          </button>
          <p class="import-hint">Товари додадуться у ваш поточний закуп</p>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.shared-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.top-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 960px;
  height: 60px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 20;
  gap: 4px;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--text);
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.spacer { flex: 1; }

.content {
  margin-top: 60px;
  padding: 16px;
  flex: 1;
}

/* Error */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.error-state p {
  font-size: 15px;
  color: var(--muted);
}

.btn-home {
  min-height: 44px;
  padding: 0 24px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 600;
}

/* List */
.list-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.list-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.list-count {
  font-size: 13px;
  color: var(--muted);
}

.store-groups {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.store-name {
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  background: var(--bg);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid var(--border);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.item-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--primary);
  border: 2px solid var(--primary);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: var(--text);
}

.item-qty {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.item-unit {
  font-size: 12px;
  color: var(--muted);
  min-width: 24px;
}

/* Import */
.import-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.btn-import {
  width: 100%;
  min-height: 52px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 700;
  transition: opacity 200ms ease;
}

.btn-import:disabled {
  opacity: 0.6;
}

.import-hint {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}
</style>
