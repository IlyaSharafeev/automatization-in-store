<script setup lang="ts">
import { useI18nStore } from '@/stores/i18n'

const props = defineProps<{
  message: string
  visible: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const i18n = useI18nStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click.self="emit('cancel')">
        <div class="dialog">
          <p class="message">{{ message }}</p>
          <div class="actions">
            <button class="btn-cancel" @click="emit('cancel')">{{ i18n.t('confirm.no') }}</button>
            <button class="btn-confirm" @click="emit('confirm')">{{ i18n.t('confirm.yes') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.dialog {
  background: var(--card);
  border-radius: var(--radius);
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
}

.message {
  font-size: 16px;
  color: var(--text);
  margin-bottom: 20px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 10px 20px;
  min-height: 44px;
  border-radius: var(--radius);
  color: var(--muted);
  font-size: 15px;
  font-weight: 500;
}

.btn-confirm {
  padding: 10px 20px;
  min-height: 44px;
  border-radius: var(--radius);
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
