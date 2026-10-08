import { alternativeImageIds, catalogImageIds } from '@/data/imageSets'
import { exerciseImage } from './images'

/**
 * Précharge en arrière-plan les illustrations des alternatives (« machine occupée ») et les miniatures
 * du catalogue (panneau « Ajouter un exercice »),
 * pour qu'elles soient disponibles hors ligne à la salle sans alourdir le premier lancement.
 * Le service worker les met en cache (CacheFirst). Une seule fois par version, quand le
 * téléphone est en ligne, sans mode « économie de données », et quand l'app est au repos.
 */
export function warmAlternativeImages(version = 2): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const key = 'ari:v1:warm-images'
  try {
    if (localStorage.getItem(key) === String(version)) return
  } catch {
    return
  }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (!navigator.onLine || conn?.saveData) return

  const urls = [
    ...alternativeImageIds.flatMap((id) => [0, 1].flatMap((i) => [exerciseImage(id, i, 'thumb'), exerciseImage(id, i)])),
    ...catalogImageIds.map((id) => exerciseImage(id, 0, 'thumb')),
  ]
  const idle = (cb: () => void) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(cb, { timeout: 5000 })
    else globalThis.setTimeout(cb, 1000)
  }

  const run = async () => {
    // Attendre que le service worker contrôle la page, sinon rien ne serait mis en cache.
    await navigator.serviceWorker.ready
    for (const url of urls) {
      try {
        await fetch(url)
      } catch {
        return // hors ligne entre-temps : on réessaiera au prochain lancement
      }
      await new Promise((r) => window.setTimeout(r, 150))
    }
    try {
      localStorage.setItem(key, String(version))
    } catch {
      /* stockage indisponible */
    }
  }
  window.setTimeout(() => idle(() => void run()), 15000)
}
