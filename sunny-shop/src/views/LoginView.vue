<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useSessionStore } from '@/stores/session'
import { useHistoryStore } from '@/stores/history'

const router = useRouter()
const authStore = useAuthStore()
const productsStore = useProductsStore()
const sessionStore = useSessionStore()
const historyStore = useHistoryStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')

async function onSubmit() {
  error.value = ''
  try {
    if (mode.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value, name.value || undefined)
    }
    await syncAll()
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Помилка. Спробуйте ще раз.'
  }
}

async function syncAll() {
  await Promise.all([
    productsStore.fetchFromServer(),
    sessionStore.fetchFromServer(),
    historyStore.fetchFromServer(),
  ])
}

async function onLogout() {
  await authStore.logout()
  router.push('/')
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}
</script>

<template>
  <div class="login-view">
    <!-- Already logged in -->
    <div v-if="authStore.isLoggedIn" class="login-card">
      <div class="login-logo">👤</div>
      <h2 class="login-title">{{ authStore.user?.name || authStore.user?.email || 'Акаунт' }}</h2>
      <p v-if="authStore.user?.email" class="login-sub">{{ authStore.user.email }}</p>

      <button class="login-btn logout-btn" @click="onLogout">
        Вийти
      </button>
      <button class="login-skip" @click="router.push('/')">
        Назад
      </button>
    </div>

    <!-- Auth form -->
    <div v-else class="login-card">
      <div class="login-logo">☀️</div>
      <h1 class="login-title">Sunny Shop</h1>
      <p class="login-sub">{{ mode === 'login' ? 'Увійти в акаунт' : 'Створити акаунт' }}</p>

      <form class="login-form" @submit.prevent="onSubmit">
        <input
          v-if="mode === 'register'"
          v-model="name"
          type="text"
          placeholder="Ім'я (необов'язково)"
          class="login-input"
          autocomplete="name"
        />
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="login-input"
          required
          autocomplete="email"
        />
        <input
          v-model="password"
          type="password"
          :placeholder="mode === 'register' ? 'Пароль (мін. 8 символів)' : 'Пароль'"
          class="login-input"
          required
          autocomplete="current-password"
          :minlength="mode === 'register' ? 8 : undefined"
        />

        <p v-if="error" class="login-error">{{ error }}</p>

        <button type="submit" class="login-btn" :disabled="authStore.loading">
          {{ authStore.loading ? '...' : mode === 'login' ? 'Увійти' : 'Зареєструватись' }}
        </button>
      </form>

      <button class="login-toggle" @click="toggleMode">
        {{ mode === 'login' ? 'Немає акаунту? Зареєструватись' : 'Вже є акаунт? Увійти' }}
      </button>

      <button class="login-skip" @click="router.push('/')">
        Продовжити без входу
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px 16px 88px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--card);
  border-radius: 16px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}

.login-logo {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 4px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.login-sub {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 8px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.login-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
}

.login-input:focus {
  border-color: var(--primary);
}

.login-error {
  font-size: 13px;
  color: var(--danger);
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 13px;
  background: var(--primary);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius);
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 4px;
}

.login-btn:disabled {
  opacity: 0.6;
}

.logout-btn {
  background: var(--danger);
  margin-top: 16px;
}

.login-toggle {
  font-size: 14px;
  color: var(--primary);
  margin-top: 12px;
  cursor: pointer;
  background: none;
  border: none;
}

.login-skip {
  font-size: 13px;
  color: var(--muted);
  margin-top: 4px;
  cursor: pointer;
  background: none;
  border: none;
}
</style>
