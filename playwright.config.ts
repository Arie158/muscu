import { defineConfig, devices } from '@playwright/test'

// Tests de parcours (navigateur réel, taille téléphone, sous-chemin GitHub Pages /sport/).
// En local sous Windows, PW_CHANNEL=msedge utilise Edge déjà installé (aucun téléchargement).
// En CI, Chromium est installé par le workflow (npx playwright install --with-deps chromium).
const channel = process.env.PW_CHANNEL || undefined
const port = 4173

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Pixel 7'],
    channel,
    baseURL: `http://localhost:${port}/sport/`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    // Le service worker mettrait en cache d'anciennes versions entre deux runs : on le bloque.
    serviceWorkers: 'block',
  },
  webServer: {
    command: `npx vite build --base /sport/ && npx vite preview --base /sport/ --port ${port} --strictPort`,
    url: `http://localhost:${port}/sport/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
