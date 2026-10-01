import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { runMigrations } from './lib/migrations'
import './assets/main.css'

// Mise à niveau des données locales avant que les stores ne les lisent (aucun historique perdu).
try {
  runMigrations(localStorage)
} catch (err) {
  console.error('Migration des données impossible', err)
}

const app = createApp(App).use(createPinia()).use(router)
// Monter après la résolution de la première route (vue chargée à la demande) : pas de saut de mise en page.
void router.isReady().then(() => app.mount('#app'))
