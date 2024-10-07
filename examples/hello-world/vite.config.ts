/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const noRefresh: Plugin = {
  name: 'vite:react-no-refresh',
  config (config) {
    return {
      ...config,
      server: {
        ...config.server,
        hmr: false,
      }
    }
  },
}

export default defineConfig({
  plugins: [noRefresh, react(), noRefresh],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    clearMocks: true,
    restoreMocks: true,
    sequence: {
      hooks: "stack",
    }
  },
})
