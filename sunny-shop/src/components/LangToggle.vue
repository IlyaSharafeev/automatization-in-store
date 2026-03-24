<script setup lang="ts">
import { useI18nStore } from '@/stores/i18n'

const i18n = useI18nStore()

function toggle() {
  i18n.setLocale(i18n.locale === 'uk' ? 'ru' : 'uk')
}
</script>

<template>
  <button class="lang-toggle" @click="toggle" :aria-label="i18n.t('lang.toggle')">
    {{ i18n.t('lang.toggle') }}
  </button>
</template>

<style scoped>
.lang-toggle {
  min-height: 44px;
  min-width: 44px;
  padding: 0 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
