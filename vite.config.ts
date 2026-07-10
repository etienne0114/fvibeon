import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = parseInt(process.env.LEARN_BACKEND_PORT || '4100', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
