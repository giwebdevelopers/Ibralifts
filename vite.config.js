import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Single-user, local-only PWA. No backend, no analytics.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      workbox: {
        // SPA fallback so deep links / refresh work offline.
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
      manifest: {
        name: 'ibralifts',
        short_name: 'ibralifts',
        description: 'A calm, fast lift tracker built for progressive overload.',
        theme_color: '#f6f4ef',
        background_color: '#f6f4ef',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
