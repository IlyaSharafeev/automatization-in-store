import { animate } from 'motion'
import type { AnimationOptions, DOMKeyframesDefinition } from 'motion'

const noMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Spring presets using framer-motion v12 API (type: 'spring')
const snappy: AnimationOptions = { type: 'spring', stiffness: 300, damping: 20 }
const soft: AnimationOptions = { type: 'spring', stiffness: 200, damping: 18 }
const tight: AnimationOptions = { type: 'spring', stiffness: 400, damping: 25 }

// Spring-like cubic-bezier for keyframe sequences
const bounceEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

function anim(el: HTMLElement, keyframes: DOMKeyframesDefinition, opts?: AnimationOptions) {
  return animate(el, keyframes, opts)
}

export function useSpringAnimate() {
  /** Scale bounce on checkbox check/uncheck */
  const bounceCheck = (el: HTMLElement) => {
    if (noMotion()) return
    return anim(el,
      { scaleX: [1, 0.82, 1.18, 1], scaleY: [1, 0.82, 1.18, 1] },
      { ease: bounceEase, duration: 0.4 })
  }

  /** Scale bounce for the count badge */
  const bounceBadge = (el: HTMLElement) => {
    if (noMotion()) return
    return anim(el,
      { scaleX: [1, 1.35, 1], scaleY: [1, 1.35, 1] },
      { ease: bounceEase, duration: 0.3 })
  }

  /** Staggered entrance for product rows */
  const slideInRows = (els: HTMLElement[]) => {
    if (noMotion()) return
    els.forEach((el, i) =>
      anim(el,
        { opacity: [0, 1], y: [16, 0] },
        { delay: Math.min(i, 15) * 0.03, ...soft }))
  }

  /** Slide out + fade for deleted row, resolves when done */
  const slideOutRow = (el: HTMLElement): Promise<void> => {
    if (noMotion()) return Promise.resolve()
    return anim(el, { opacity: [1, 0], x: [0, -40] },
      { ...snappy, duration: 0.3 }).finished.then(() => undefined)
  }

  /** Spring snap-back after swipe */
  const snapBack = (el: HTMLElement) => {
    if (noMotion()) return
    return anim(el, { x: 0 }, { type: 'spring', stiffness: 400, damping: 30 })
  }

  /** Quick press bounce for stepper buttons */
  const bounceBtn = (el: HTMLElement) => {
    if (noMotion()) return
    return anim(el,
      { scaleX: [1, 0.8, 1], scaleY: [1, 0.8, 1] },
      { ...tight })
  }

  /** Scale pop for quantity number */
  const bounceQty = (el: HTMLElement) => {
    if (noMotion()) return
    return anim(el,
      { scaleX: [1, 1.4, 1], scaleY: [1, 1.4, 1] },
      { type: 'spring', stiffness: 400, damping: 20 })
  }

  /** Slide store content in from a horizontal direction */
  const slideTabContent = (el: HTMLElement, fromX: number) => {
    if (noMotion()) return
    return anim(el, { opacity: [0, 1], x: [fromX, 0] }, { ...soft })
  }

  /** Spring-animate the sliding tab indicator */
  const animateTabIndicator = (el: HTMLElement, left: number, width: number) => {
    if (noMotion()) {
      el.style.left = `${left}px`
      el.style.width = `${width}px`
      return
    }
    anim(el, { left: `${left}px`, width: `${width}px` }, { ...tight })
  }

  return {
    bounceCheck, bounceBadge, slideInRows, slideOutRow,
    snapBack, bounceBtn, bounceQty, slideTabContent, animateTabIndicator,
  }
}
