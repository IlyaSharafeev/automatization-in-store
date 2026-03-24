<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { STORES, type StoreId } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useI18nStore } from '@/stores/i18n'
import { useSpringAnimate } from '@/composables/useSpringAnimate'
import { useShake } from '@/composables/useShake'
import { useStorage } from '@/composables/useStorage'
import { useVibrate } from '@vueuse/core'
import StoreSection from '@/components/StoreSection.vue'
import LangToggle from '@/components/LangToggle.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const i18n = useI18nStore()
const storage = useStorage()
const { bounceBadge, slideTabContent, animateTabIndicator } = useSpringAnimate()
const { vibrate } = useVibrate()

// ── Active store tab ──────────────────────────────────────────────
const activeStoreId = ref<StoreId>(
  (storage.get<StoreId>('activeStore')) ?? 'zhanet'
)

const activeStore = computed(() => STORES.find(s => s.id === activeStoreId.value)!)

// ── Refs ──────────────────────────────────────────────────────────
const tabsEl = ref<HTMLElement>()
const indicatorEl = ref<HTMLElement>()
const storeContentEl = ref<HTMLElement>()
const countBadgeEl = ref<HTMLElement>()
const tabButtonEls = ref<HTMLElement[]>([])

function setTabRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) tabButtonEls.value[index] = el
}

// ── Tab switching ─────────────────────────────────────────────────
let prevStoreIndex = STORES.findIndex(s => s.id === activeStoreId.value)

function switchTab(storeId: StoreId) {
  const newIndex = STORES.findIndex(s => s.id === storeId)
  const direction = newIndex > prevStoreIndex ? 60 : -60
  prevStoreIndex = newIndex

  activeStoreId.value = storeId
  storage.set('activeStore', storeId)

  // Move indicator with spring
  nextTick(() => {
    const tabEl = tabButtonEls.value[newIndex]
    if (tabEl && indicatorEl.value) {
      animateTabIndicator(indicatorEl.value, tabEl.offsetLeft, tabEl.offsetWidth)
    }
    // Slide store content in from correct direction
    if (storeContentEl.value) {
      slideTabContent(storeContentEl.value, direction)
    }
    // Stagger product rows
    const rows = storeContentEl.value?.querySelectorAll<HTMLElement>('.product-row')
    if (rows && rows.length) {
      const spring = useSpringAnimate()
      spring.slideInRows(Array.from(rows))
    }
  })
}

// ── Position indicator on mount ───────────────────────────────────
onMounted(() => {
  nextTick(() => {
    const idx = STORES.findIndex(s => s.id === activeStoreId.value)
    const tabEl = tabButtonEls.value[idx]
    if (tabEl && indicatorEl.value) {
      indicatorEl.value.style.left = `${tabEl.offsetLeft}px`
      indicatorEl.value.style.width = `${tabEl.offsetWidth}px`
    }
    // Entrance animation for initial load
    if (storeContentEl.value) {
      const rows = storeContentEl.value.querySelectorAll<HTMLElement>('.product-row')
      if (rows.length) {
        const sp = useSpringAnimate()
        sp.slideInRows(Array.from(rows))
      }
    }
  })
})

// ── Animate badge on checkedCount change ──────────────────────────
watch(() => sessionStore.checkedCount, () => {
  if (countBadgeEl.value) bounceBadge(countBadgeEl.value)
})

// ── Dialogs ───────────────────────────────────────────────────────
const showClearConfirm = ref(false)
const showShakeClearDialog = ref(false)

function handleClear() {
  showClearConfirm.value = false
  sessionStore.clearCurrent()
}

function handleShakeClear() {
  showShakeClearDialog.value = false
  sessionStore.clearCurrent()
}

function handleFinish() {
  vibrate([30])
  sessionStore.finishSession()
  router.push('/history')
}

// ── Shake to clear ────────────────────────────────────────────────
const { shakeDetected } = useShake()
watch(shakeDetected, (v) => {
  if (v && sessionStore.checkedCount > 0) {
    showShakeClearDialog.value = true
  }
})
</script>

<template>
  <div class="home">
    <!-- Fixed top header -->
    <header class="top-header">
      <span class="app-title">{{ i18n.t('app.title') }}</span>
      <LangToggle />
    </header>

    <!-- Sticky tab bar -->
    <div class="store-tabs" ref="tabsEl">
      <button
        v-for="(store, i) in STORES"
        :key="store.id"
        :ref="(el) => setTabRef(el, i)"
        class="store-tab"
        :class="{ active: activeStoreId === store.id }"
        :style="{ '--tab-color': store.color } as any"
        @click="switchTab(store.id)"
      >
        {{ store.name }}
      </button>
      <div
        ref="indicatorEl"
        class="tab-indicator"
        :style="{ background: activeStore.color }"
      />
    </div>

    <!-- Scrollable content: only active store -->
    <main class="content">
      <div ref="storeContentEl" class="store-content">
        <StoreSection :key="activeStoreId" :store="activeStore" />
      </div>
    </main>

    <!-- Fixed bottom action bar -->
    <div class="bottom-bar">
      <button
        class="btn-clear"
        :disabled="sessionStore.checkedCount === 0"
        @click="showClearConfirm = true"
      >
        {{ i18n.t('home.clearAll') }}
      </button>

      <span ref="countBadgeEl" class="count-pill" style="will-change: transform;">
        {{ i18n.t('home.selected', { n: sessionStore.checkedCount }) }}
      </span>

      <button
        class="btn-finish"
        :disabled="sessionStore.checkedCount === 0"
        @click="handleFinish"
      >
        {{ i18n.t('home.finish') }}
      </button>
    </div>

    <!-- Confirm: clear all -->
    <ConfirmDialog
      :visible="showClearConfirm"
      :message="i18n.t('home.clearConfirm')"
      @confirm="handleClear"
      @cancel="showClearConfirm = false"
    />

    <!-- Confirm: shake to clear -->
    <ConfirmDialog
      :visible="showShakeClearDialog"
      :message="'Струснути і очистити список?'"
      @confirm="handleShakeClear"
      @cancel="showShakeClearDialog = false"
    />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* ── Fixed header ── */
.top-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 60px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 20;
}

.app-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

/* ── Tab bar ── */
.store-tabs {
  display: flex;
  position: sticky;
  top: 60px;
  z-index: 15;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  /* room for the absolute indicator */
  padding-bottom: 0;
  /* push below fixed header */
  margin-top: 60px;
}

.store-tab {
  flex: 1;
  padding: 12px 4px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  color: var(--muted);
  cursor: pointer;
  border: none;
  background: none;
  transition: color 200ms ease;
  min-height: 44px;
}

.store-tab.active {
  color: var(--tab-color, var(--primary));
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  border-radius: 2px 2px 0 0;
  will-change: left, width;
  transition: none; /* motion handles this */
}

/* ── Scrollable content ── */
.content {
  /* tabs are in the flow (sticky), no additional margin needed */
  padding: 0 0 calc(64px + 64px + env(safe-area-inset-bottom)) 0;
}

.store-content {
  will-change: transform, opacity;
}

/* ── Bottom action bar ── */
.bottom-bar {
  position: fixed;
  bottom: 64px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 64px;
  background: var(--card);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  z-index: 50;
}

.btn-clear {
  min-height: 44px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--muted);
  flex-shrink: 0;
}

.btn-clear:disabled {
  opacity: 0.4;
}

.count-pill {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.btn-finish {
  min-height: 44px;
  padding: 0 16px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.btn-finish:disabled {
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .store-tab {
    transition: none;
  }
}
</style>
