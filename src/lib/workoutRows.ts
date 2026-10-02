// Logique pure des « lignes » d'un bloc du mode séance.
// Une ligne = une série (exercice seul, superset) ou un tour (circuit). Certains exercices
// d'un circuit font moins de tours que le bloc (ou plus) : une ligne ne contient que les
// exercices qui ont une série à cet index.
import type { SessionItem, Target } from '@/data/types'
import type { SetLog } from './models'
import { formatTarget } from './format'

export interface RowExercise {
  exerciseId: string
  target: Target
  perSide?: string
  sets: SetLog[]
}

export interface RowEntry<E extends RowExercise = RowExercise> {
  ex: E
  /** Index de l'exercice dans le bloc. */
  j: number
  set: SetLog
}

export const rowCount = (exercises: RowExercise[]): number => Math.max(1, ...exercises.map((e) => e.sets.length))

export function rowEntries<E extends RowExercise>(exercises: E[], k: number): RowEntry<E>[] {
  return exercises.flatMap((ex, j) => (ex.sets[k] ? [{ ex, j, set: ex.sets[k]! }] : []))
}

export const isRowDone = (exercises: RowExercise[], k: number): boolean => rowEntries(exercises, k).every((x) => x.set.done)

/** Première ligne pas encore terminée, ou -1 si tout est fait. */
export function firstOpenRow(exercises: RowExercise[]): number {
  const n = rowCount(exercises)
  for (let k = 0; k < n; k++) if (!isRowDone(exercises, k)) return k
  return -1
}

const unitSuffix = (t: Target) => (t.kind === 'duree' ? ' s' : t.kind === 'minutes' ? ' min' : '')

/**
 * Résumé d'une ligne repliée : « 45 kg × 8 · RIR 2 » ; « 30 s + 12 » pour un superset ;
 * « 3 / 8 exercices » pour un circuit de plus de 2 exercices.
 */
export function rowSummary<E extends RowExercise>(exercises: E[], k: number, usesKg: (ex: E) => boolean): string {
  const list = rowEntries(exercises, k)
  if (list.length > 2) return `${list.filter((x) => x.set.done).length} / ${list.length} exercices`
  return list
    .map(({ ex, set }) => {
      const load = set.load !== null && usesKg(ex) ? `${set.load} kg × ` : ''
      const rir = set.done && set.rir !== null ? ` · RIR ${set.rir}` : ''
      return `${load}${set.reps ?? '—'}${unitSuffix(ex.target)}${rir}`
    })
    .join('  +  ')
}

/** Volume affiché sous le titre du bloc : « 4 × 6-8 », « 3 tours · 8 exercices », « 15-20 min ». */
export function blockVolume(format: SessionItem['format'], exercises: RowExercise[]): string {
  const rows = rowCount(exercises)
  if (format === 'activite') return exercises[0] ? formatTarget(exercises[0].target) : ''
  if (format === 'circuit') return `${rows} tour${rows > 1 ? 's' : ''} · ${exercises.length} exercices`
  return `${rows} × ${exercises.map((e) => formatTarget(e.target, e.perSide)).join(' + ')}`
}
