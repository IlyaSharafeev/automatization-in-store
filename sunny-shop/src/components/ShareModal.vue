<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  url: string
  title?: string
}>()

const emit = defineEmits<{ close: [] }>()

const toast = useToast()
const qrDataUrl = ref('')
const copied = ref(false)

onMounted(async () => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(props.url, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
  } catch {
    // ignore
  }
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    toast.success('Посилання скопійовано')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    toast.error('Не вдалося скопіювати')
  }
}

async function nativeShare() {
  try {
    await navigator.share({ title: props.title ?? 'Список покупок', url: props.url })
  } catch {
    // user cancelled or not supported — silently ignore
  }
}

const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Поділитись списком</span>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <p class="hint">Відскануйте QR-код або поділіться посиланням</p>

          <div class="qr-wrap">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code" class="qr-img" />
            <div v-else class="qr-placeholder">Генерується...</div>
          </div>

          <div class="url-row">
            <span class="url-text">{{ url }}</span>
          </div>

          <div class="actions">
            <button class="btn-copy" :class="{ copied }" @click="copyLink">
              {{ copied ? '✓ Скопійовано' : '📋 Копіювати посилання' }}
            </button>
            <button v-if="hasNativeShare" class="btn-share" @click="nativeShare">
              📤 Поділитись
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
}

@media (min-width: 480px) {
  .modal-overlay {
    align-items: center;
  }
}

.modal {
  background: var(--card);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  animation: slide-up 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (min-width: 480px) {
  .modal {
    border-radius: 16px;
    max-width: 360px;
  }
}

@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg);
  color: var(--muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.hint {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.qr-wrap {
  width: 220px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.qr-img {
  width: 220px;
  height: 220px;
  display: block;
}

.qr-placeholder {
  font-size: 13px;
  color: var(--muted);
}

.url-row {
  width: 100%;
  background: var(--bg);
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
}

.url-text {
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
  line-height: 1.4;
}

.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-copy {
  width: 100%;
  min-height: 44px;
  border-radius: var(--radius);
  background: var(--primary);
  color: white;
  font-size: 15px;
  font-weight: 600;
  transition: background 200ms ease;
}

.btn-copy.copied {
  background: #2e7d32;
}

.btn-share {
  width: 100%;
  min-height: 44px;
  border-radius: var(--radius);
  border: 1.5px solid var(--primary);
  color: var(--primary);
  font-size: 15px;
  font-weight: 600;
}
</style>
