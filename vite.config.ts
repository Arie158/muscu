/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { programImageIds } from './src/data/imageSets.ts'

// Chemin de base configurable : BASE_PATH=/mon-depot/ npm run build
// Par défaut './' (chemins relatifs) : fonctionne sous n'importe quel sous-chemin GitHub Pages.
const base = process.env.BASE_PATH || './'

export default defineConfig({
  base,
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Programme Muscu — 26 semaines',
        short_name: 'Muscu 26S',
        description: 'Programme de musculation, mode séance et suivi, hors ligne.',
        lang: 'fr',
        theme_color: '#11151c',
        background_color: '#11151c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pré-cache à l'installation : l'app + les illustrations des exercices du programme
        // (pleine taille et miniatures). Les alternatives sont mises en cache à la demande
        // (et préchargées en arrière-plan par l'app, cf. src/lib/warmImages.ts).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', ...programImageIds.map((id) => `exercises/${id}/*.webp`)],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/exercises/'),
            handler: 'CacheFirst',
            options: { cacheName: 'illustrations', expiration: { maxEntries: 500 } },
          },
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
