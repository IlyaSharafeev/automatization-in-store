<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'
import BottomNav from '@/components/BottomNav.vue'

const sessionStore = useSessionStore()
const historyStore = useHistoryStore()

onMounted(() => {
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
  </div>
</template>

<style scoped>
.app-wrapper {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg);
  position: relative;
  overflow-x: hidden;
}
</style>
