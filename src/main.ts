import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { runMigrations } from './lib/migrations'
import { useStoragePersistence } from './composables/useStoragePersistence'
import { warmAlternativeImages } from './lib/warmImages'
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

// Demande au navigateur de ne pas effacer les données de l’app (séances, pesées, photos).
void useStoragePersistence().request()

// Images des alternatives (machine occupée) préchargées en arrière-plan pour le hors ligne.
warmAlternativeImages()
