<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useStoresStore } from '@/stores/userStores'
import { maybeStartOnboarding } from '@/composables/useOnboarding'
import { useTheme } from '@/composables/useTheme'
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { useToast } from '@/composables/useToast'
import { useAppUpdate } from '@/composables/useAppUpdate'
import BottomNav from '@/components/BottomNav.vue'
import PwaInstallBanner from '@/components/PwaInstallBanner.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const sessionStore = useSessionStore()
const historyStore = useHistoryStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const storesStore = useStoresStore()
useTheme()

const { isOnline } = useOnlineStatus()
const toast = useToast()
const { updateAvailable, init: initUpdate, applyUpdate } = useAppUpdate()

watch(isOnline, (online, wasOnline) => {
  if (!wasOnline && online) {
    toast.success('Підключення відновлено')
  } else if (wasOnline && !online) {
    toast.warning('Немає інтернету — зміни збережені локально')
  }
})

onMounted(async () => {
  initUpdate()
  // Try to restore auth session
  await authStore.init()

  // If logged in, sync data from server
  if (authStore.isLoggedIn) {
    await Promise.all([
      productsStore.fetchFromServer(),
      sessionStore.fetchFromServer(),
      historyStore.fetchFromServer(),
      settingsStore.fetchFromServer(),
      storesStore.fetchFromServer(),
    ])
  }

  // Start onboarding for new users
  maybeStartOnboarding()

  // Pre-check frequent items if session is empty
  if (sessionStore.checkedCount === 0) {
    const frequent = historyStore.getFrequentProductIds(12)
    if (frequent.length > 0) {
      frequent.forEach(id => sessionStore.toggle(id))
    }
  }
})
</script>

<template>
  <div class="app-wrapper">
    <RouterView v-slot="{ Component, route }">
      <Transition name="slide">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <BottomNav />
    <PwaInstallBanner />
    <ToastContainer />
    <Transition name="slide-up">
      <div v-if="updateAvailable" class="update-banner">
        <span>Доступна нова версія</span>
        <button class="update-btn" @click="applyUpdate">Оновити</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-wrapper {
  max-width: 960px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg);
  position: relative;
  overflow-x: hidden;
}

@media (min-width: 768px) {
  .app-wrapper {
    padding-top: 64px; /* space for top nav */
  }
}
</style>

<style>
.update-banner {
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 480px;
  background: #1e1e1e;
  color: #fff;
  border-radius: 14px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  z-index: 9999;
  font-size: 14px;
}

.update-btn {
  background: #4CAF50;
  color: white;
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 300ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
