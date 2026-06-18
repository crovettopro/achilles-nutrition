/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: string
  readonly VITE_MINIMAX_API_KEY?: string
  readonly VITE_MINIMAX_GROUP_ID?: string
  readonly VITE_MINIMAX_BASE_URL?: string
  readonly VITE_MINIMAX_MODEL?: string
  readonly VITE_MINIMAX_VISION_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
