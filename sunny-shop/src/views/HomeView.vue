<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import { STORES, type StoreId } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'
import { useI18nStore } from '@/stores/i18n'
import { useSpringAnimate } from '@/composables/useSpringAnimate'
import { useShake } from '@/composables/useShake'
import { useStorage } from '@/composables/useStorage'
import StoreSection from '@/components/StoreSection.vue'
import LangToggle from '@/components/LangToggle.vue'
import ShareButton from '@/components/ShareButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const historyStore = useHistoryStore()
const i18n = useI18nStore()
const storage = useStorage()
const { bounceBadge, slideTabContent, animateTabIndicator } = useSpringAnimate()

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

  nextTick(() => {
    const tabEl = tabButtonEls.value[newIndex]
    if (tabEl && indicatorEl.value) {
      animateTabIndicator(indicatorEl.value, tabEl.offsetLeft, tabEl.offsetWidth)
    }
    if (storeContentEl.value) {
      slideTabContent(storeContentEl.value, direction)
    }
    const rows = storeContentEl.value?.querySelectorAll<HTMLElement>('.product-row')
    if (rows && rows.length) {
      const sp = useSpringAnimate()
      sp.slideInRows(Array.from(rows))
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

// ── Feature 1: Confetti on finish ─────────────────────────────────
async function handleFinish() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.7 },
    colors: ['#4CAF50', '#FF9800', '#e91e63', '#1565c0', '#2e7d32', '#fff'],
    disableForReducedMotion: true,
  })

  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 120,
      origin: { y: 0.6 },
      startVelocity: 20,
      colors: ['#4CAF50', '#FF9800', '#ffffff'],
      disableForReducedMotion: true,
    })
  }, 200)

  if ('vibrate' in navigator) navigator.vibrate([30, 50, 30, 50, 60])

  await new Promise<void>(resolve => setTimeout(resolve, 600))

  sessionStore.finishSession()
  router.push('/history')
}

// ── Feature 2: Repeat last purchase ───────────────────────────────
function repeatLast() {
  const last = historyStore.lastSession
  if (last) {
    sessionStore.loadFromSession(last.items)
    if ('vibrate' in navigator) navigator.vibrate([10, 40, 10])
  }
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
      <ShareButton v-if="sessionStore.checkedCount > 0" />
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
      <div ref="storeContentEl" class="store-content store-tabs-content">
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

      <!-- Feature 2: repeat last when list is empty -->
      <button
        v-if="sessionStore.checkedCount === 0 && historyStore.lastSession"
        class="repeat-last-btn"
        @click="repeatLast"
      >
        🔁 {{ i18n.t('home.repeatLast') }}
      </button>

      <button
        v-else
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
      :message="i18n.t('home.shakeConfirm')"
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
  padding: 0 12px;
  gap: 8px;
  z-index: 20;
}

.app-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  flex-shrink: 0;
}

/* ── Tab bar ── */
.store-tabs {
  display: flex;
  position: sticky;
  top: 60px;
  z-index: 15;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
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
  transition: none;
}

/* ── Scrollable content ── */
.content {
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

.repeat-last-btn {
  min-height: 44px;
  padding: 0 14px;
  border: 1.5px solid var(--primary);
  color: var(--primary);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .store-tab {
    transition: none;
  }
}
</style>
