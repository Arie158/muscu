import { ref, watch, type Ref } from 'vue'

export const STORAGE_PREFIX = 'ari:v1:'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error('Sauvegarde locale impossible', err)
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* stockage indisponible */
  }
}

/** Ref synchronisée avec localStorage (valeurs par défaut fusionnées pour les objets). */
export function persistedRef<T>(key: string, initial: T): Ref<T> {
  const stored = loadJSON<T>(key, initial)
  const value =
    initial && typeof initial === 'object' && !Array.isArray(initial) && stored && typeof stored === 'object'
      ? ({ ...initial, ...stored } as T)
      : stored
  const r = ref(value) as Ref<T>
  watch(r, (v) => saveJSON(key, v), { deep: true })
  return r
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
