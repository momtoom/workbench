/// <reference types="vite/client" />

declare module '@tabler/icons-react/dist/esm/icons/*.mjs' {
  const module: Record<string, unknown>;
  export default module;
  export const __iconNode: unknown;
}

interface ImportMetaEnv {
  readonly VITE_WORKBENCH_CORE_URL?: string;
  readonly VITE_WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
