/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
