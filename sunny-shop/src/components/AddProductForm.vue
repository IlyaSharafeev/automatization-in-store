<script setup lang="ts">
import { ref } from 'vue'
import { useProductsStore, type StoreId, type Unit } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useI18nStore } from '@/stores/i18n'

const props = defineProps<{
  storeId: StoreId
}>()

const productsStore = useProductsStore()
const sessionStore = useSessionStore()
const i18n = useI18nStore()

const open = ref(false)
const name = ref('')
const unit = ref<Unit>('шт')

const UNITS: Unit[] = ['кг', 'л', 'шт', 'г', 'пач', 'бан']

function submit() {
  if (!name.value.trim()) return
  productsStore.addCustomProduct(name.value.trim(), props.storeId, unit.value)
  // find the newly added product and auto-check it
  const all = productsStore.products
  const added = all[all.length - 1]
  if (added) sessionStore.toggle(added.id)
  name.value = ''
  unit.value = 'шт'
  open.value = false
}

function cancel() {
  name.value = ''
  unit.value = 'шт'
  open.value = false
}
</script>

<template>
  <div class="add-form-wrapper">
    <button class="open-btn" @click="open = !open">
      {{ i18n.t('home.addProduct') }}
    </button>

    <Transition name="expand">
      <div v-if="open" class="form">
        <input
          v-model="name"
          class="input"
          :placeholder="i18n.t('home.addProductName')"
          type="text"
          @keyup.enter="submit"
        />
        <select v-model="unit" class="select">
          <option v-for="u in UNITS" :key="u" :value="u">{{ i18n.t(`unit.${u}`) }}</option>
        </select>
        <div class="form-actions">
          <button class="btn-submit" @click="submit">{{ i18n.t('home.addProductSubmit') }}</button>
          <button class="btn-cancel" @click="cancel">{{ i18n.t('home.addProductCancel') }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.add-form-wrapper {
  padding: 8px 16px 12px;
  background: var(--card);
}

.open-btn {
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
  min-height: 44px;
  padding: 8px 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  overflow: hidden;
}

.input {
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 12px;
  color: var(--text);
  background: var(--bg);
  width: 100%;
}

.select {
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 12px;
  color: var(--text);
  background: var(--bg);
  width: 100%;
  appearance: auto;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.btn-submit {
  flex: 1;
  height: 44px;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 600;
}

.btn-cancel {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--muted);
  font-size: 18px;
}

.expand-enter-active {
  transition: max-height 250ms ease, opacity 200ms ease;
  max-height: 200px;
}
.expand-leave-active {
  transition: max-height 200ms ease, opacity 150ms ease;
  max-height: 200px;
}
.expand-enter-from {
  max-height: 0;
  opacity: 0;
}
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
