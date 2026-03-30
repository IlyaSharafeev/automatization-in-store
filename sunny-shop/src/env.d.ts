/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number
    spread?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    angle?: number
    scalar?: number
    shapes?: string[]
    zIndex?: number
    disableForReducedMotion?: boolean
  }
  function confetti(options?: Options): Promise<null>
  export = confetti
}
