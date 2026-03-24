# Sunny Shop — Project Specification

## Overview

Mobile-first Vue 3 SPA for automating grocery shopping in Sunny Beach, Bulgaria.
Stores: Жанет, Лідл, Младост.

**Core UX principle:** User opens app → sees all products grouped by store → most-used items already pre-checked based on history → unchecks what they don't need → goes shopping. Zero typing for regular use.

---

## Tech Stack

- Vue 3 + Composition API (`<script setup lang="ts">`)
- Vite
- Pinia (state management)
- Vue Router 4
- TypeScript
- No UI library — custom CSS with CSS variables
- All persistence: localStorage only

---

## Data Models

```ts
type StoreId = 'zhanet' | 'lidl' | 'mladost' | 'any'
type Unit = 'кг' | 'л' | 'шт' | 'г' | 'пач' | 'бан' | '—'

interface Store {
  id: StoreId
  name: string
  color: string
}

interface Product {
  id: string
  name: string
  storeId: StoreId
  unit: Unit
  isCustom: boolean
  isReminder?: boolean
}

interface CheckedItem {
  productId: string
  quantity: number
}

interface ShoppingSession {
  id: string
  date: string // ISO
  items: CheckedItem[]
}
```

---

## Stores Config

```ts
const STORES: Store[] = [
  { id: 'zhanet',  name: 'Жанет',    color: '#e91e63' },
  { id: 'lidl',    name: 'Лідл',     color: '#1565c0' },
  { id: 'mladost', name: 'Младост',  color: '#2e7d32' },
  { id: 'any',     name: 'Будь-який', color: '#757575' },
]
```

---

## Seed Products

### Жанет

| id | name | unit |
|----|------|------|
| zh-01 | М'ясо фарш | кг |
| zh-02 | Куряча грудка | шт |
| zh-03 | М'ясо шматок | кг |
| zh-04 | Крила курячі | кг |
| zh-05 | Ковбаса паличка | шт |
| zh-06 | Крабові палички | пач |
| zh-07 | Сир | кг |
| zh-08 | Плавлені сирки | шт |
| zh-09 | Яйця | шт |
| zh-10 | Творог | кг |
| zh-11 | Булочка | шт |
| zh-12 | Кебаб | шт |
| zh-13 | Помідори | кг |
| zh-14 | Огірки | кг |
| zh-15 | Перець болгарський | кг |
| zh-16 | Мариновані огірки | бан |
| zh-17 | Зелень | пач |
| zh-18 | Гриби | кг |
| zh-19 | Буряк | кг |
| zh-20 | Морква | кг |
| zh-21 | Цибуля | кг |
| zh-22 | Картопля | кг |
| zh-23 | Яблука | кг |
| zh-24 | Швепс / Напої | л |
| zh-25 | Алкоголь | шт |

### Лідл

| id | name | unit | isReminder |
|----|------|------|-----------|
| li-01 | Хліб | шт | |
| li-02 | Молоко | л | |
| li-03 | Масло вершкове | шт | |
| li-04 | Пончики | пач | |
| li-05 | Макарони | пач | |
| li-06 | Рис | кг | |
| li-07 | Борошно | кг | |
| li-08 | Цукор | кг | |
| li-09 | Сіль | пач | |
| li-10 | Олія соняшникова | л | |
| li-11 | Майонез | шт | |
| li-12 | Соус | шт | |
| li-13 | Тунець | шт | |
| li-14 | Лаваш | шт | |
| li-15 | Хлопья / Мюслі | пач | |
| li-16 | Чіпси | пач | |
| li-17 | Акційна полка ⭐ | — | true |

### Младост

| id | name | unit |
|----|------|------|
| ml-01 | Апельсини | кг |
| ml-02 | Банани | кг |
| ml-03 | Норі | пач |
| ml-04 | Крючки (снеки) | пач |
| ml-05 | Желейні цукерки | пач |
| ml-06 | Чай | пач |
| ml-07 | Мед | шт |
| ml-08 | Соус ягідний | шт |

### Будь-який магазин

| id | name | unit |
|----|------|------|
| an-01 | Дезодоранти | шт |
| an-02 | Презервативи | пач |
| an-03 | Краплі для очей | шт |
| an-04 | Гель для інтиму | шт |
| an-05 | Серветки столові | пач |
| an-06 | Кісточки для унітазу | шт |
| an-07 | Полички для ванни | шт |
| an-08 | Кружка | шт |
| an-09 | Філадельфія | шт |
| an-10 | Жуйки Теніс | пач |
| an-11 | Шоколад | шт |
| an-12 | Сухарики | пач |
| an-13 | Печиво | пач |

---

## Pinia Stores

### `stores/products.ts` — useProductsStore

State:
- `products: Product[]` — persisted to localStorage key `'products'`

On init: if localStorage is empty → load full seed from above.

Actions:
- `addCustomProduct(name: string, storeId: StoreId, unit: Unit)` — push new product with generated uuid, isCustom: true
- `deleteProduct(id: string)` — allowed for ALL products (both custom and predefined). Always show confirmation before delete.

Getters:
- `productsByStore` — `Map<StoreId, Product[]>` grouped by storeId, ordered as STORES array

---

### `stores/session.ts` — useSessionStore

State:
- `checkedItems: CheckedItem[]` — persisted to localStorage key `'session'`

Actions:
- `toggle(productId: string)` — if not checked: add with qty=1. If checked: remove.
- `updateQty(productId: string, quantity: number)` — update qty; if qty <= 0: remove item
- `finishSession()` — create ShoppingSession with current date + items, call historyStore.addSession(), then clear checkedItems
- `clearCurrent()` — clear checkedItems without saving to history

Getters:
- `isChecked(productId: string): boolean`
- `getQty(productId: string): number`
- `checkedCount: number` — total number of checked items

---

### `stores/history.ts` — useHistoryStore

State:
- `sessions: ShoppingSession[]` — persisted to localStorage key `'history'`, max 30 entries (drop oldest when exceeded)

Actions:
- `addSession(session: ShoppingSession)`
- `clearHistory()` — with confirmation dialog

Getters:
- `getFrequentProductIds(topN = 12): string[]` — count how many sessions each productId appears in across all sessions, return top N sorted by frequency descending. Returns empty array if fewer than 2 sessions exist.

---

### `stores/i18n.ts` — useI18nStore

State:
- `locale: 'uk' | 'ru'` — persisted to localStorage key `'locale'`, default `'uk'`

Actions:
- `setLocale(l: 'uk' | 'ru')`
- `t(key: string): string` — returns translation string for current locale

Translations must cover ALL UI strings. See `i18n/uk.ts` and `i18n/ru.ts`.

---

## Auto-Preselection Logic (critical feature)

In `App.vue` `onMounted`, run ONCE if `checkedItems` is currently empty:

```ts
const frequent = historyStore.getFrequentProductIds(12)
if (frequent.length > 0) {
  frequent.forEach(id => sessionStore.toggle(id))
}
```

Result: user opens app → top 12 most-bought items already checked → they just uncheck what they don't need → done.
If history has fewer than 2 sessions → nothing pre-checked → user checks manually (first-time experience).

---

## Routing

Two routes only:
- `/` → `HomeView`
- `/history` → `HistoryView`

`BottomNav` always visible with 2 tabs.

Page transition: `<Transition name="slide">` — slide left/right on route change.

---

## HomeView (`/`)

### Fixed top header (60px height)
- Left: "🛒 Sunny Shop" — 16px, font-weight 500
- Right: `LangToggle` component — toggles UA ↔ RU

### Scrollable content area
Between header and bottom bar. Has `padding-bottom: calc(64px + env(safe-area-inset-bottom))`.

Renders 4 `StoreSection` components in order: Жанет → Лідл → Младост → Будь-який.

### StoreSection component

**Sticky sub-header** (`position: sticky; top: 60px`):
- 4px left border in store color
- Store name (bold)
- Badge: "N checked / M total" (e.g. "3 / 25")

**Product rows** (via `ProductRow` component):

Normal product:
```
[checkbox 44px] [name]  .....  [− N + stepper if checked]  [unit]
```
- Checkbox tap → `sessionStore.toggle(productId)`
- When unchecked: name in muted color (`var(--muted)`), no stepper
- When checked: name in normal color, stepper appears inline
- Stepper: `−` button | qty number | `+` button (each min 32px tap target)
- `−` decreases qty, removes item if reaches 0
- `+` increases qty

isReminder product (Акційна полка ⭐):
```
[checkbox 44px] [name ⭐]  .....  [no stepper, no unit]
```
Just a simple check/uncheck, no quantity.

**Delete:** Long-press (500ms) on any product row reveals delete button (red trash icon). Tap trash → `ConfirmDialog` → `productsStore.deleteProduct(id)`. Works for ALL products (custom and predefined).

**Add product form** (via `AddProductForm` component):
- "＋ Додати продукт" small secondary button at bottom of each store section
- Tap → inline expandable form (animated height transition) within that section:
  - Text input: product name (required)
  - Select: unit (кг / л / шт / г / пач / бан)
  - storeId: pre-filled with current section's store (hidden)
  - "Додати" submit button + "✕" cancel button
- On submit: `productsStore.addCustomProduct()` → product appears in list → auto-checked

### Fixed bottom bar (64px)
- Left: "Очистити все" — muted text button, disabled if 0 checked → `ConfirmDialog` → `clearCurrent()`
- Center: pill showing checked count (e.g. "5 обрано")
- Right: "Завершити ✓" — green primary button, disabled if 0 checked → `finishSession()` → `router.push('/history')`

---

## HistoryView (`/history`)

### Fixed header
- Back arrow button → `router.push('/')`
- Title: "Історія закупів"

### Content

If `sessions` is empty:
- SVG empty state icon (shopping bag outline) + "Ще немає закупів" text

If sessions exist (reverse chronological):
- `HistoryCard` per session:
  - Header: date formatted as `dd.MM.yyyy HH:mm` + total items count
  - Collapsed by default, tap to expand
  - Expanded: items grouped by store, showing `name × qty unit`

Bottom buttons:
- "🛍 Новий закуп" primary button → `router.push('/')` (auto-preselection will re-run since checkedItems was cleared)
- "🗑 Очистити історію" danger text button → `ConfirmDialog` → `historyStore.clearHistory()`

---

## CSS Variables & Styling

```css
:root {
  --primary: #4CAF50;
  --primary-dark: #388E3C;
  --bg: #f5f5f5;
  --card: #ffffff;
  --text: #212121;
  --muted: #9e9e9e;
  --danger: #f44336;
  --border: #e0e0e0;
  --radius: 8px;
}
```

Rules:
- App wrapper: `max-width: 480px; margin: 0 auto; min-height: 100dvh; background: var(--bg)`
- All interactive elements: `min-height: 44px` (mobile tap targets)
- Custom checkbox: 24px square, `border-radius: 6px`, green fill + white `✓` when checked, `transition: all 150ms ease`
- Store section sticky sub-headers: `position: sticky; top: 60px; z-index: 10; background: var(--card); border-left: 4px solid [store.color]`
- Bottom nav: `position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; height: 64px; background: var(--card); border-top: 1px solid var(--border); display: flex;`
- Slide transition:
```css
.slide-enter-active, .slide-leave-active { transition: transform 250ms ease; }
.slide-enter-from { transform: translateX(100%); }
.slide-leave-to  { transform: translateX(-100%); }
```

---

## i18n Strings (both uk.ts and ru.ts)

Must include keys for:
- `app.title`
- `nav.list`, `nav.history`
- `home.clearAll`, `home.finish`, `home.selected` (e.g. "5 обрано")
- `home.addProduct`, `home.addProductSubmit`, `home.addProductCancel`
- `home.addProductName`, `home.addProductUnit`
- `home.deleteConfirm` (e.g. "Видалити «{name}»?")
- `home.clearConfirm`
- `history.title`, `history.empty`, `history.newSession`
- `history.clearHistory`, `history.clearConfirm`
- `history.items` (e.g. "5 позицій")
- `confirm.yes`, `confirm.no`
- `lang.toggle`
- All unit labels: кг, л, шт, г, пач, бан

---

## File Structure

```
src/
  components/
    ProductRow.vue        # checkbox row + qty stepper + long-press delete
    StoreSection.vue      # sticky header + product list + add form
    AddProductForm.vue    # inline expandable add form
    HistoryCard.vue       # session card with expand/collapse
    BottomNav.vue         # 2-tab navigation
    LangToggle.vue        # UA/RU toggle button
    ConfirmDialog.vue     # reusable confirmation modal
  composables/
    useStorage.ts         # generic localStorage composable: get<T>(key), set<T>(key, value)
    useLongPress.ts       # long-press directive/composable (500ms threshold)
  stores/
    products.ts
    session.ts
    history.ts
    i18n.ts
  views/
    HomeView.vue
    HistoryView.vue
  router/
    index.ts
  i18n/
    uk.ts
    ru.ts
  App.vue
  main.ts
  style.css
```

---

## Requirements Summary

- All files fully implemented — no TODOs, no placeholders
- Auto-preselection must work on first load when history has ≥ 2 sessions
- Delete must work for all products (custom and predefined) with confirmation
- isReminder rows must render without qty stepper
- Long-press on product row to reveal delete
- All text via `t()` — no hardcoded Ukrainian/Russian strings in components
- Smooth transitions on: checkbox check, stepper appear/disappear, add form expand, page navigation
