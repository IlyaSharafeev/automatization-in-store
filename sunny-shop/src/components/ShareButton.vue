<script setup lang="ts">
import { ref } from 'vue'
import html2canvas from 'html2canvas'
import { useI18nStore } from '@/stores/i18n'

const i18n = useI18nStore()
const isGenerating = ref(false)

async function handleShare() {
  isGenerating.value = true

  try {
    const listEl = document.querySelector('.store-tabs-content') as HTMLElement | null
    if (!listEl) return

    const canvas = await html2canvas(listEl, {
      backgroundColor: '#f5f5f5',
      scale: 2,
      useCORS: true,
      logging: false,
    })

    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], 'sunny-shop-list.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Мій список закупів',
          files: [file],
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sunny-shop-list.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <button class="share-btn" @click="handleShare" :disabled="isGenerating">
    <span v-if="isGenerating">⏳</span>
    <span v-else>📤</span>
    {{ i18n.t('home.share') }}
  </button>
</template>

<style scoped>
.share-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
}

.share-btn:active {
  transform: scale(0.95);
}

.share-btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
