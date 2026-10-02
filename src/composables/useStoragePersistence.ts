import { ref, readonly } from 'vue'

// Demande au navigateur de ne pas effacer les données de l'app (localStorage, IndexedDB)
// quand l'espace manque ou après une période d'inactivité.
// Chrome/Edge accordent souvent sans demander (surtout si l'app est installée) ;
// Firefox peut afficher une question ; Safari décide selon l'usage et l'installation.

type Status = 'inconnu' | 'protege' | 'non-protege' | 'non-supporte'
const status = ref<Status>('inconnu')

async function refresh(): Promise<Status> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
    status.value = 'non-supporte'
  } else {
    status.value = (await navigator.storage.persisted()) ? 'protege' : 'non-protege'
  }
  return status.value
}

/** Demande la persistance (sans effet si déjà accordée). */
async function request(): Promise<Status> {
  try {
    if (!navigator.storage?.persist) return refresh()
    if (await navigator.storage.persisted()) return (status.value = 'protege')
    status.value = (await navigator.storage.persist()) ? 'protege' : 'non-protege'
  } catch {
    status.value = 'non-supporte'
  }
  return status.value
}

export function useStoragePersistence() {
  return { status: readonly(status), refresh, request }
}
