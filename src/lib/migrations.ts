// Migrations des données localStorage. Fonctions pures + une fonction d'application
// sur un objet de type Storage (testable avec un faux stockage).
import { DEFAULT_HOME_EQUIPMENT } from '@/data/home'
import { exercisesById } from '@/data/exercises'
import { sessionsById } from '@/data/sessions'
import type { HomeEquipment, SessionId } from '@/data/types'
import type { WorkoutLog } from './models'

export const SCHEMA_VERSION = 2
export const PREFIX = 'ari:v1:'
const SCHEMA_KEY = `${PREFIX}schema`

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Variante par défaut d'un exercice maison dans d'anciennes données : élastique si possible. */
function defaultEquipment(exerciseId: string): HomeEquipment | undefined {
  const variants = exercisesById[exerciseId]?.variants
  if (!variants) return undefined
  return variants.band ? 'band' : variants.improvised ? 'improvised' : variants.none ? 'none' : undefined
}

/** v1 → v2 : lieu de chaque séance, variante de matériel par défaut (élastique) pour les exercices maison. */
export function migrateWorkouts(logs: unknown): WorkoutLog[] {
  if (!Array.isArray(logs)) return []
  return logs.filter(isObj).map((raw) => {
    const log = raw as unknown as WorkoutLog
    const location = log.location ?? sessionsById[log.sessionId as SessionId]?.location ?? 'gym'
    const exercises = (Array.isArray(log.exercises) ? log.exercises : []).map((ex) => {
      if (ex.equipment || exercisesById[ex.exerciseId]?.location !== 'home') return ex
      const equipment = defaultEquipment(ex.exerciseId)
      return equipment ? { ...ex, equipment } : ex
    })
    return { ...log, location, exercises, notes: log.notes ?? '' }
  })
}

/** v1 → v2 : matériel disponible à la maison (défaut : élastique + charge improvisée). */
export function migrateSettings(settings: unknown): Record<string, unknown> {
  const s = isObj(settings) ? { ...settings } : {}
  const eq = s.homeEquipment
  if (!Array.isArray(eq) || !eq.every((e) => e === 'band' || e === 'improvised' || e === 'none')) {
    s.homeEquipment = [...DEFAULT_HOME_EQUIPMENT]
  }
  return s
}

/** Une séance en cours enregistrée avant la v2 ne connaît pas les variantes : on la conserve en complétant. */
export function migrateActive(active: unknown): unknown {
  if (!isObj(active) || !Array.isArray(active.items)) return active
  return {
    ...active,
    items: active.items.map((item: unknown) => {
      if (!isObj(item) || !Array.isArray(item.exercises)) return item
      return {
        ...item,
        exercises: item.exercises.map((ex: unknown) =>
          isObj(ex) ? { equipment: null, dumbbells: false, tempo: 'normal', level: '', ...ex } : ex,
        ),
      }
    }),
  }
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function read(storage: StorageLike, key: string): unknown {
  const raw = storage.getItem(PREFIX + key)
  if (raw === null) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** Applique les migrations nécessaires. Idempotent. Renvoie la version de départ. */
export function runMigrations(storage: StorageLike): number {
  const from = Number(storage.getItem(SCHEMA_KEY) ?? 1)
  if (from >= SCHEMA_VERSION) return from
  const workouts = read(storage, 'workouts')
  if (workouts !== undefined) storage.setItem(PREFIX + 'workouts', JSON.stringify(migrateWorkouts(workouts)))
  const settings = read(storage, 'settings')
  if (settings !== undefined) storage.setItem(PREFIX + 'settings', JSON.stringify(migrateSettings(settings)))
  const active = read(storage, 'active')
  if (active !== undefined && active !== null) storage.setItem(PREFIX + 'active', JSON.stringify(migrateActive(active)))
  storage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION))
  return from
}
