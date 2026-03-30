<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStoresStore } from '@/stores/userStores'
import { usePushNotifications } from '@/composables/usePushNotifications'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const storesStore = useStoresStore()
const toast = useToast()
const push = usePushNotifications()
const api = useApi()

interface Stats {
  totalSessions: number
  totalSpent: number
  avgSessionCost: number
  maxSession: number
  byStore: { storeId: string; total: number; count: number }[]
  byMonth: { label: string; total: number; count: number }[]
  topByCount: { productClientId: string; name: string; times: number }[]
  topByValue: { productClientId: string; name: string; total: number }[]
}

const stats = ref<Stats | null>(null)
const statsLoading = ref(true)

async function fetchStats() {
  try {
    const data = await api.get<Stats>('/api/stats')
    if (data) stats.value = data
  } catch {
    // offline — ignore
  } finally {
    statsLoading.value = false
  }
}

const chartMax = computed(() =>
  Math.max(...(stats.value?.byMonth.map(m => m.total) ?? []), 1)
)

const editingName = ref(false)
const nameInput = ref(authStore.user?.name ?? '')
const savingName = ref(false)

async function saveName() {
  if (!nameInput.value.trim()) return
  savingName.value = true
  try {
    await authStore.updateProfile({ name: nameInput.value.trim() })
    editingName.value = false
    toast.success('Ім\'я збережено')
  } catch {
    toast.error('Не вдалося зберегти')
  } finally {
    savingName.value = false
  }
}

const showPasswordForm = ref(false)
const newPassword = ref('')
const newPasswordConfirm = ref('')
const passwordError = ref('')
const passwordSuccess = ref(false)

async function onSetPassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  if (newPassword.value.length < 8) { passwordError.value = 'Мінімум 8 символів'; return }
  if (newPassword.value !== newPasswordConfirm.value) { passwordError.value = 'Паролі не збігаються'; return }
  try {
    await authStore.setPassword(newPassword.value)
    passwordSuccess.value = true
    newPassword.value = ''
    newPasswordConfirm.value = ''
    setTimeout(() => { showPasswordForm.value = false; passwordSuccess.value = false }, 2000)
    toast.success('Пароль встановлено')
  } catch (e: any) {
    passwordError.value = e.message || 'Помилка'
  }
}

async function onLogout() {
  await authStore.logout()
  router.push('/')
}

onMounted(() => {
  push.checkSubscribed()
  fetchStats()
})

const initials = computed(() => {
  const name = authStore.user?.name
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const firstInitial = parts[0]?.[0] ?? ''
    const secondInitial = parts[1]?.[0] ?? ''
    return (firstInitial + secondInitial).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})
</script>

<template>
  <div class="profile-view">
    <header class="top-header">
      <button class="back-btn" @click="router.push('/')">‹</button>
      <span class="title">Профіль</span>
      <span class="spacer" />
    </header>

    <main class="content">

      <div class="user-card">
        <div class="avatar-wrap">
          <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" class="avatar-img" alt="avatar" />
          <div v-else class="avatar-initials">{{ initials }}</div>
        </div>

        <div class="user-info">
          <div v-if="!editingName" class="name-row">
            <span class="user-name">{{ authStore.user?.name || 'Без імені' }}</span>
            <button class="edit-btn" @click="editingName = true; nameInput = authStore.user?.name ?? ''">✏️</button>
          </div>
          <div v-else class="name-edit-row">
            <input
                v-model="nameInput"
                class="name-input"
                placeholder="Ваше ім'я"
                @keyup.enter="saveName"
                @keyup.escape="editingName = false"
                autofocus
            />
            <button class="save-btn" @click="saveName" :disabled="savingName">
              {{ savingName ? '...' : '✓' }}
            </button>
            <button class="cancel-btn" @click="editingName = false">✕</button>
          </div>
          <span class="user-email">{{ authStore.user?.email || 'Email не вказано' }}</span>
          <div class="badges-row">
            <span v-if="authStore.user?.googleId" class="badge google">Google</span>
            <span v-if="authStore.user?.hasPassword" class="badge password">Пароль</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Статистика</div>

        <!-- Loading skeleton -->
        <div v-if="statsLoading" class="stats-skeleton">
          <div class="skel-grid">
            <div class="skel-box" v-for="n in 4" :key="n" />
          </div>
          <div class="skel-chart" />
        </div>

        <!-- Empty state -->
        <p v-else-if="!stats || stats.totalSessions === 0" class="empty-stats">
          Завершіть перший закуп, щоб побачити статистику
        </p>

        <!-- Stats -->
        <template v-else>
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-value">{{ stats.totalSessions }}</span>
              <span class="stat-label">закупів</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">₴{{ stats.totalSpent.toFixed(0) }}</span>
              <span class="stat-label">всього</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">₴{{ stats.avgSessionCost.toFixed(0) }}</span>
              <span class="stat-label">середній</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">₴{{ stats.maxSession.toFixed(0) }}</span>
              <span class="stat-label">рекорд</span>
            </div>
          </div>

          <!-- By store -->
          <div class="chart-wrap" v-if="stats.byStore.length > 0">
            <div class="chart-title">По магазинах</div>
            <div class="store-bars">
              <div v-for="s in stats.byStore" :key="s.storeId" class="store-bar-row">
                <span class="store-bar-label">
                  <span
                    class="store-dot"
                    :style="{ background: storesStore.getById(s.storeId)?.color ?? '#aaa' }"
                  />
                  {{ storesStore.getById(s.storeId)?.name ?? s.storeId }}
                </span>
                <div class="store-bar-track">
                  <div
                    class="store-bar-fill"
                    :style="{
                      width: `${(s.total / (stats.byStore[0]?.total ?? 1)) * 100}%`,
                      background: storesStore.getById(s.storeId)?.color ?? 'var(--primary)'
                    }"
                  />
                </div>
                <span class="store-bar-amount">₴{{ s.total.toFixed(0) }}</span>
              </div>
            </div>
          </div>

          <!-- Monthly chart -->
          <div class="chart-wrap" v-if="stats.totalSpent > 0">
            <div class="chart-title">Витрати по місяцях (₴)</div>
            <div class="bar-chart">
              <div v-for="m in stats.byMonth" :key="m.label" class="bar-col">
                <span class="bar-value" v-if="m.total > 0">{{ m.total.toFixed(0) }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ height: m.total > 0 ? `${(m.total / chartMax) * 100}%` : '2px' }"
                  />
                </div>
                <span class="bar-label">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <!-- Top by frequency -->
          <div class="top-products" v-if="stats.topByCount.length > 0">
            <div class="chart-title">Найчастіші товари</div>
            <div v-for="(p, i) in stats.topByCount" :key="p.productClientId" class="top-product-row">
              <span class="top-rank">{{ i + 1 }}</span>
              <span class="top-name">{{ p.name }}</span>
              <div class="top-bar-wrap">
                <div class="top-bar-fill" :style="{ width: `${(p.times / (stats.topByCount[0]?.times ?? 1)) * 100}%` }" />
              </div>
              <span class="top-count">{{ p.times }}×</span>
            </div>
          </div>

          <!-- Top by value -->
          <div class="top-products" v-if="stats.topByValue.length > 0" style="border-top: 1px solid var(--border);">
            <div class="chart-title">Найдорожчі товари</div>
            <div v-for="(p, i) in stats.topByValue" :key="p.productClientId" class="top-product-row">
              <span class="top-rank">{{ i + 1 }}</span>
              <span class="top-name">{{ p.name }}</span>
              <div class="top-bar-wrap">
                <div class="top-bar-fill top-bar-fill--value" :style="{ width: `${(p.total / (stats.topByValue[0]?.total ?? 1)) * 100}%` }" />
              </div>
              <span class="top-count">₴{{ p.total.toFixed(0) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="section" v-if="push.isSupported">
        <div class="section-title">🔔 Сповіщення</div>
        <div class="push-row">
          <div class="push-info">
            <span class="push-label">Нагадування про закупи</span>
            <span class="push-sub">{{ push.isSubscribed.value ? 'Увімкнено' : 'Вимкнено' }}</span>
          </div>
          <button
              class="toggle-btn"
              :class="{ active: push.isSubscribed.value }"
              :disabled="push.isLoading.value"
              @click="push.isSubscribed.value ? push.unsubscribe() : push.subscribe()"
          >
            <span class="toggle-knob" />
          </button>
        </div>
        <button
            v-if="push.isSubscribed.value"
            class="test-push-btn"
            @click="push.sendTest()"
        >
          Надіслати тестове сповіщення
        </button>
      </div>

      <div class="section">
        <div class="section-title">🔐 Обліковий запис</div>

        <div v-if="!authStore.user?.hasPassword">
          <button
              class="action-row-btn"
              @click="showPasswordForm = !showPasswordForm"
          >
            <span>Встановити пароль</span>
            <span class="chevron-right">›</span>
          </button>
          <div v-if="showPasswordForm" class="password-form">
            <input v-model="newPassword" type="password" placeholder="Новий пароль (мін. 8)" class="field-input" autocomplete="new-password" />
            <input v-model="newPasswordConfirm" type="password" placeholder="Повторіть пароль" class="field-input" autocomplete="new-password" />
            <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="field-ok">✓ Пароль встановлено!</p>
            <button class="btn-primary-sm" @click="onSetPassword">Зберегти</button>
          </div>
        </div>
        <div v-else class="account-row">
          <span>Пароль</span>
          <span class="account-meta">встановлено ✓</span>
        </div>
      </div>

      <div class="logout-section">
        <button class="btn-logout" @click="onLogout">Вийти з облікового запису</button>
      </div>

    </main>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
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
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 768px) {
  .top-header { top: 64px; }
  .content { margin-top: calc(64px + 60px); }
}

.user-card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-initials {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.edit-btn {
  font-size: 14px;
  opacity: 0.6;
  padding: 2px;
}

.name-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-input {
  flex: 1;
  height: 36px;
  border: 1.5px solid var(--primary);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
  padding: 0 10px;
  outline: none;
}

.save-btn {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  width: 32px;
  height: 32px;
  background: var(--bg);
  color: var(--muted);
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.user-email {
  font-size: 13px;
  color: var(--muted);
}

.badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
}

.badge.google { background: #e8f5e9; color: #2e7d32; }
.badge.password { background: #e3f2fd; color: #1565c0; }

.section {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.section-title {
  padding: 14px 16px 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
}

.stats-grid {
  display: flex;
  padding: 16px;
  gap: 8px;
}

.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  background: var(--bg);
  border-radius: 10px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}

.chart-wrap {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
}

.chart-title {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 10px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  gap: 3px;
}

.bar-value {
  font-size: 9px;
  color: var(--primary);
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.bar-track {
  flex: 1;
  width: 100%;
  background: var(--bg);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--primary);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 400ms ease;
}

.bar-label {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}

.top-products {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
}

.top-product-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}

.top-rank {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  min-width: 16px;
}

.top-name {
  font-size: 13px;
  color: var(--text);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar-wrap {
  width: 80px;
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.top-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 400ms ease;
}

.top-count {
  font-size: 12px;
  color: var(--muted);
  min-width: 28px;
  text-align: right;
}

/* Loading skeleton */
.stats-skeleton {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skel-grid {
  display: flex;
  gap: 8px;
}

.skel-box {
  flex: 1;
  height: 64px;
  background: var(--bg);
  border-radius: 10px;
  animation: skel-pulse 1.4s ease-in-out infinite;
}

.skel-chart {
  height: 120px;
  background: var(--bg);
  border-radius: 10px;
  animation: skel-pulse 1.4s ease-in-out infinite;
}

@keyframes skel-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Store bars */
.store-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-bar-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text);
  min-width: 80px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.store-bar-track {
  flex: 1;
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}

.store-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 400ms ease;
}

.store-bar-amount {
  font-size: 12px;
  color: var(--muted);
  min-width: 52px;
  text-align: right;
}

.top-bar-fill--value {
  background: #f59e0b;
}

.empty-stats {
  padding: 16px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.push-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.push-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.push-label {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
}

.push-sub {
  font-size: 12px;
  color: var(--muted);
}

.toggle-btn {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: var(--border);
  position: relative;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.toggle-btn.active {
  background: var(--primary);
}

.toggle-btn:disabled {
  opacity: 0.5;
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  transition: transform 200ms ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-btn.active .toggle-knob {
  transform: translateX(20px);
}

.test-push-btn {
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  color: var(--primary);
  border-top: 1px solid var(--border);
}

.action-row-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 15px;
  color: var(--text);
}

.chevron-right {
  font-size: 20px;
  color: var(--muted);
}

.password-form {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border);
}

.field-input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-size: 15px;
  padding: 0 12px;
  outline: none;
}

.field-input:focus { border-color: var(--primary); }

.field-error { font-size: 13px; color: var(--danger); }
.field-ok { font-size: 13px; color: var(--primary); }

.btn-primary-sm {
  min-height: 40px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 15px;
  color: var(--text);
}

.account-meta {
  font-size: 13px;
  color: var(--primary);
}

.logout-section {
  padding: 8px 0 16px;
}

.btn-logout {
  width: 100%;
  min-height: 44px;
  color: var(--danger);
  font-size: 15px;
  font-weight: 500;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
</style>