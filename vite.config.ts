import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const backendPort = parseInt(process.env.LEARN_BACKEND_PORT || '4100', 10);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Vibeon Learn',
        short_name: 'Vibeon Learn',
        description: 'Learn Kinyarwanda, English, and French — courses, practice, and an AI tutor, anywhere.',
        theme_color: '#2E1F26',
        background_color: '#FBF3E9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell (JS/CSS/HTML/icons) is precached automatically. On top
        // of that, cache read-only API responses (courses, lessons, paths,
        // certificates, dashboard, vocabulary) so a previously-viewed
        // course or lesson still opens with no connection — but never
        // auth, progress-tracking, AI, translation, or cron, which must
        // always hit the network.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }: { url: URL; request: Request }) => {
              if (request.method !== 'GET') return false;
              if (!url.pathname.startsWith('/api/')) return false;
              const excluded = ['/api/auth', '/api/progress', '/api/ai', '/api/cron', '/api/translation'];
              return !excluded.some((prefix) => url.pathname.startsWith(prefix));
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vibeon-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
