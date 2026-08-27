import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(`RELEASE-${buildTimestamp}-UTC`)
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
