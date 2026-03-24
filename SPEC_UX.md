# Sunny Shop — UX & Animation Upgrade

This file extends SPEC.md. Read SPEC.md first, then apply everything here on top.

---

## New Dependencies

```bash
npm install @vueuse/core motion
```

- **motion** (Motion One) — spring animations via `animate()` and `spring()` easing
- **@vueuse/core** — `useSwipe`, `useDeviceMotion`, `onLongPress`, `useVibrate`

---

## Layout Change: Store Tabs Instead of Scroll

**Remove** the single scrollable page with 4 stacked store sections.

**Replace** with:
- Horizontal tab bar at the top (below the main header)
- One tab per store: Жанет / Лідл / Младост / Будь-який
- Only the active store's products are visible — no vertical scrolling between stores
- Switching tabs = instant store switch with slide animation

### Tab Bar design

```
[ Жанет 🌸 ]  [ Лідл 🔵 ]  [ Младост 🌿 ]  [ Будь-який ]
```

- Fixed below main header (`position: sticky; top: 60px`)
- Active tab: colored bottom border (3px solid store.color) + store color text
- Inactive tabs: muted gray
- Tab switch animation: active indicator slides horizontally with `motion` spring
- On tab switch: product list animates in from left/right depending on direction (slide + fade)

### Store tab state

```ts
const activeStoreId = ref<StoreId>('zhanet')
```

Persisted to localStorage key `'activeStore'` so user returns to last store.

---

## Animation Library Usage

Use **Motion One** (`import { animate, spring } from 'motion'`) for all animations.
Use spring easing everywhere for the "живий і пружний" feel:

```ts
spring({ stiffness: 300, damping: 20 })  // snappy spring — for checkboxes, buttons
spring({ stiffness: 200, damping: 18 })  // soft spring — for list items, panels
spring({ stiffness: 400, damping: 25 })  // tight spring — for tab indicator
```

---

## Animated Interactions

### 1. Checkbox tap — spring bounce

When user taps a checkbox to check it:
```ts
animate(checkboxEl, 
  { scale: [1, 0.85, 1.15, 1], backgroundColor: [...] },
  { easing: spring({ stiffness: 300, damping: 20 }) }
)
```
- Scale bounces: shrinks → overshoots → settles
- Background transitions from white to `var(--primary)` green
- White checkmark pops in with `opacity: [0, 1]` + `scale: [0.5, 1]`
- Haptic feedback: `useVibrate([10])` on check, `useVibrate([5])` on uncheck

When unchecking:
- Reverse: green → white, checkmark fades out, gentle scale pulse

### 2. Product row — entrance animation

When store tab is switched, product rows animate in staggered:
```ts
// animate each row with stagger
rows.forEach((el, i) => {
  animate(el,
    { opacity: [0, 1], y: [16, 0] },
    { delay: i * 0.03, easing: spring({ stiffness: 200, damping: 18 }) }
  )
})
```
- Rows fall in from below with 30ms stagger between items
- Max stagger: first 15 items only (skip stagger for rest to avoid long wait)

### 3. Quantity change — swipe gesture on row

Use `useSwipe` from @vueuse/core on each product row.

When item is checked:
- **Swipe right** on row → increase qty by 1
- **Swipe left** on row → decrease qty by 1 (remove if reaches 0)

Visual feedback during swipe:
- Row slides with finger (translateX follows touch, max ±80px)
- Right side reveals green `+1` badge
- Left side reveals red `−1` badge (or 🗑 if qty is 1)
- On release: row snaps back with spring, qty number animates with scale bounce

```ts
animate(qtyEl, { scale: [1, 1.4, 1] }, { easing: spring({ stiffness: 400, damping: 20 }) })
```

Haptic on qty change: `useVibrate([8])`

### 4. Qty stepper buttons (when swiping is not used)

`−` and `+` buttons still exist as fallback.
On tap: button scales down then up with spring bounce:
```ts
animate(btnEl, { scale: [1, 0.8, 1] }, { easing: spring({ stiffness: 400, damping: 25 }) })
```

### 5. Tab switching animation

Tab content slides in from correct direction:
- Switching to right tab → content slides in from right (`translateX: [60px, 0]`)
- Switching to left tab → content slides in from left (`translateX: [-60px, 0]`)
- Plus fade: `opacity: [0, 1]`
- Active tab indicator (bottom border) slides with spring:

```ts
animate(indicatorEl, { left: targetLeft, width: targetWidth },
  { easing: spring({ stiffness: 400, damping: 25 }) }
)
```

### 6. Item added to list — pop in

When an item gets checked (added to list):
- Row background flashes briefly to light green then back
- Checked count badge in bottom bar animates: scale bounce + number rolls up

```ts
animate(countBadge, { scale: [1, 1.3, 1] }, { easing: spring({ stiffness: 300, damping: 20 }) })
```

### 7. Item removed — slide out

When item is unchecked or deleted:
- Row animates out: `opacity: [1, 0]`, `x: [0, -40px]`, `height: [rowHeight, 0]`
- Surrounding rows close the gap smoothly

### 8. Add product form — spring expand

When "＋ Додати продукт" is tapped:
- Form expands from 0 height with spring: `height: [0, formHeight]`, `opacity: [0, 1]`
- Input field slides in with slight delay
- On close: reverse collapse with spring

### 9. Finish session — celebration

When "Завершити ✓" is tapped:
- Button does a satisfying scale + color pulse
- Checked items all animate out simultaneously (staggered, fly up + fade)
- Then navigate to history

### 10. Shake to clear — device motion

Use `useDeviceMotion` from @vueuse/core.

Detect shake gesture:
```ts
const { acceleration } = useDeviceMotion()

watch(acceleration, (a) => {
  const force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z)
  if (force > 25) {
    triggerShakeClear() // show confirm dialog to clear all checked items
  }
})
```

On shake detected:
- Phone vibrates: `useVibrate([50, 100, 50])`
- `ConfirmDialog` appears: "Струснути і очистити список?" [Так / Ні]
- If confirmed: all rows animate out with random directions (chaotic fly-out)
- Cooldown: 2 seconds between shake detections to prevent repeated triggers

Also keep the "Очистити все" button in bottom bar as fallback.

---

## Updated ProductRow Component

```vue
<template>
  <div
    ref="rowEl"
    class="product-row"
    :class="{ checked: isChecked }"
  >
    <!-- Swipe background indicators -->
    <div class="swipe-bg-left">＋1</div>
    <div class="swipe-bg-right">−1</div>

    <!-- Row content -->
    <div class="row-content" ref="contentEl">
      <button class="checkbox-btn" @click="handleCheck">
        <div ref="checkboxEl" class="checkbox" :class="{ active: isChecked }">
          <span class="checkmark">✓</span>
        </div>
      </button>

      <span class="product-name">{{ product.name }}</span>

      <div v-if="isChecked && !product.isReminder" class="qty-stepper">
        <button ref="minusBtn" @click="handleMinus">−</button>
        <span ref="qtyEl" class="qty-num">{{ qty }}</span>
        <button ref="plusBtn" @click="handlePlus">＋</button>
      </div>

      <span class="unit">{{ product.isReminder ? '' : product.unit }}</span>
    </div>
  </div>
</template>
```

Swipe detection via `useSwipe(contentEl)` from @vueuse/core.

---

## Updated HomeView Layout

```
┌─────────────────────────────┐
│  🛒 Sunny Shop        UA/RU │  ← fixed header 60px
├─────────────────────────────┤
│ [Жанет] [Лідл] [Младост] …  │  ← sticky tabs 48px, spring indicator
├─────────────────────────────┤
│                             │
│  ☑ М'ясо фарш  ← → 2  кг  │
│  ☐ Куряча грудка        шт  │
│  ☑ Помідори    ← → 1  кг   │
│  ...                        │  ← only current store products
│                             │
│  ＋ Додати продукт          │
├─────────────────────────────┤
│ Очистити  [5 обрано]  ✓ Фін │  ← fixed bottom bar 64px
└─────────────────────────────┘
└──── 🛒 Список  |  📋 Історія ───┘  ← bottom nav
```

---

## CSS Additions

```css
/* Row swipe backgrounds */
.product-row {
  position: relative;
  overflow: hidden;
}
.swipe-bg-left {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 80px; background: var(--primary);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 500; font-size: 18px;
  opacity: 0; /* shown during swipe via JS */
}
.swipe-bg-right {
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 80px; background: var(--danger);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 500; font-size: 18px;
  opacity: 0;
}

/* Checkbox */
.checkbox {
  width: 28px; height: 28px;
  border: 2px solid var(--border);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: white;
  will-change: transform, background-color;
}
.checkbox.active {
  background: var(--primary);
  border-color: var(--primary);
}
.checkmark {
  color: white;
  font-size: 16px;
  font-weight: 700;
}

/* Tab bar */
.store-tabs {
  display: flex;
  position: sticky; top: 60px; z-index: 10;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  position: relative;
}
.store-tab {
  flex: 1; padding: 12px 4px;
  font-size: 13px; font-weight: 500;
  text-align: center;
  color: var(--muted);
  cursor: pointer; border: none; background: none;
  transition: color 200ms;
}
.store-tab.active { color: var(--tab-color, var(--primary)); }
.tab-indicator {
  position: absolute; bottom: 0; height: 3px;
  background: var(--tab-color, var(--primary));
  border-radius: 2px 2px 0 0;
  will-change: left, width;
}

/* Product row */
.product-row {
  min-height: 52px;
  border-bottom: 1px solid var(--border);
  will-change: transform, opacity;
}
.row-content {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; min-height: 52px;
  will-change: transform;
}
.product-name {
  flex: 1; font-size: 15px;
  transition: color 200ms;
}
.product-row.checked .product-name { color: var(--text); }
.product-row:not(.checked) .product-name { color: var(--muted); }

/* Qty stepper */
.qty-stepper {
  display: flex; align-items: center; gap: 4px;
}
.qty-stepper button {
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: var(--bg);
  font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  will-change: transform;
}
.qty-num {
  min-width: 24px; text-align: center;
  font-weight: 500; font-size: 15px;
  will-change: transform;
}
```

---

## Composable: `composables/useShake.ts`

```ts
import { useDeviceMotion, useVibrate } from '@vueuse/core'
import { watch, ref } from 'vue'

export function useShake(threshold = 25, cooldown = 2000) {
  const { acceleration } = useDeviceMotion()
  const { vibrate } = useVibrate()
  const shakeDetected = ref(false)
  let lastShake = 0

  watch(acceleration, (a) => {
    if (!a) return
    const force = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0)
    const now = Date.now()
    if (force > threshold && now - lastShake > cooldown) {
      lastShake = now
      vibrate([50, 100, 50])
      shakeDetected.value = true
      setTimeout(() => { shakeDetected.value = false }, 100)
    }
  })

  return { shakeDetected }
}
```

Usage in `HomeView.vue`:
```ts
const { shakeDetected } = useShake()
watch(shakeDetected, (v) => { if (v) showShakeClearDialog.value = true })
```

---

## Composable: `composables/useSpringAnimate.ts`

Thin wrapper for common spring patterns used across components:

```ts
import { animate, spring } from 'motion'

export function useSpringAnimate() {
  const bounceCheck = (el: HTMLElement) =>
    animate(el, { scale: [1, 0.82, 1.18, 1] },
      { easing: spring({ stiffness: 300, damping: 20 }), duration: 0.4 })

  const bounceBadge = (el: HTMLElement) =>
    animate(el, { scale: [1, 1.35, 1] },
      { easing: spring({ stiffness: 350, damping: 22 }), duration: 0.3 })

  const slideInRows = (els: HTMLElement[]) =>
    els.forEach((el, i) =>
      animate(el, { opacity: [0, 1], y: [16, 0] },
        { delay: Math.min(i, 15) * 0.03,
          easing: spring({ stiffness: 200, damping: 18 }) }))

  const slideOutRow = (el: HTMLElement) =>
    animate(el, { opacity: [1, 0], x: [0, -40], height: [el.offsetHeight, 0] },
      { easing: spring({ stiffness: 300, damping: 25 }), duration: 0.3 })

  const snapBack = (el: HTMLElement) =>
    animate(el, { x: 0 },
      { easing: spring({ stiffness: 400, damping: 30 }) })

  return { bounceCheck, bounceBadge, slideInRows, slideOutRow, snapBack }
}
```

---

## File Structure Changes

Add to existing structure from SPEC.md:

```
src/
  composables/
    useShake.ts          # shake detection via useDeviceMotion
    useSpringAnimate.ts  # reusable spring animation helpers
```

All other files from SPEC.md remain the same.

---

## Requirements Summary (UX additions)

- Store tabs replace vertical store sections — no scrolling between stores
- Active tab persisted to localStorage
- All animations use Motion One with spring easing
- Checkbox tap: scale bounce + color transition + haptic
- Swipe right on row: qty +1 with green indicator
- Swipe left on row: qty −1 with red indicator (or delete if qty=1)
- Tab switch: slide content + spring indicator
- Row entrance: staggered fall-in (max 15 items staggered)
- Row exit: slide out + height collapse
- Add form: spring expand/collapse
- Shake phone → confirm dialog → clear all checked items
- All haptic feedback via useVibrate
- `will-change: transform` on all animated elements for GPU compositing
- `@media (prefers-reduced-motion: reduce)` — disable all motion animations, keep functional interactions
