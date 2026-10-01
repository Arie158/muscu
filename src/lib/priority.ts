import { alertConfig } from '@/data/home'
import { PRIORITY_ORDER } from '@/data/sessions'
import type { SessionId } from '@/data/types'
import { addDays, diffDays } from './dates'
import type { DailyEntry, PerformanceEntry, WorkoutLog } from './models'
import { isProgress } from './progression'
import type { ExerciseHistory } from './criteria'

/** Trie des séances de la plus prioritaire à la moins prioritaire. */
export function byPriority(ids: SessionId[]): SessionId[] {
  const rank = (id: SessionId) => {
    const i = PRIORITY_ORDER.indexOf(id)
    return i === -1 ? PRIORITY_ORDER.length : i
  }
  return [...ids].sort((a, b) => rank(a) - rank(b))
}

/** Ordre dans lequel sauter des séances en cas de manque de temps ou d'énergie. */
export function skipOrder(ids: SessionId[] = PRIORITY_ORDER): SessionId[] {
  return byPriority(ids).reverse()
}

/** Les `count` séances à garder quand la semaine ne permet pas tout faire. */
export function sessionsToKeep(count: number, ids: SessionId[] = PRIORITY_ORDER): SessionId[] {
  return byPriority(ids).slice(0, Math.max(0, count))
}

export type AlertSignal = 'charges' | 'sommeil' | 'energie' | 'haut-en-baisse'

export interface RecoveryAlert {
  signals: AlertSignal[]
  /** Actions suggérées, dans l'ordre. */
  actions: ('retirer-series-maison-2' | 'supprimer-maison-3' | 'alleger-maison-2' | 'salle-en-dernier')[]
}

/** Nombre d'exercices salle dont la dernière séance (dans la fenêtre) est moins bonne que la précédente. */
export function decliningExercises(histories: ExerciseHistory[], today: string, windowDays = alertConfig.windowDays): string[] {
  return histories
    .filter((h) => {
      const logs = h.entries.filter((e) => e.source === 'seance' && e.date <= today)
      const last = logs[logs.length - 1]
      const prev = logs[logs.length - 2]
      if (!last || !prev || diffDays(last.date, today) >= windowDays) return false
      return isProgress(last, prev, h.loadType) // la précédente était meilleure
    })
    .map((h) => h.exerciseId)
}

/** Vrai si la dernière séance Haut A (lundi) ou Haut B (jeudi) récente est en baisse sur la majorité des exercices. */
export function upperSessionDeclined(
  logs: WorkoutLog[],
  historyFor: (exerciseId: string) => PerformanceEntry[],
  loadTypeOf: (exerciseId: string) => ExerciseHistory['loadType'] | undefined,
  today: string,
  windowDays = alertConfig.windowDays,
): boolean {
  const recent = logs
    .filter((l) => (l.sessionId === 'haut-a' || l.sessionId === 'haut-b') && diffDays(l.date, today) >= 0 && diffDays(l.date, today) < windowDays)
    .sort((a, b) => a.startedAt - b.startedAt)
  return recent.some((log) => {
    let compared = 0
    let declined = 0
    for (const ex of log.exercises) {
      const lt = loadTypeOf(ex.exerciseId)
      if (!lt || !ex.sets.some((s) => s.done)) continue
      const hist = historyFor(ex.exerciseId).filter((h) => h.date < log.date)
      const prev = hist[hist.length - 1]
      if (!prev) continue
      compared++
      const current: PerformanceEntry = { date: log.date, machine: ex.machine, sets: ex.sets, techniqueOk: ex.techniqueOk, source: 'seance' }
      if (isProgress(current, prev, lt)) declined++
    }
    return compared > 0 && declined / compared > 0.5
  })
}

/**
 * Signaux d'alerte de récupération : charges en baisse sur plusieurs exercices de salle,
 * sommeil ≤ 2/5 sur plusieurs jours, énergie ≤ 2/5 sur plusieurs jours (fenêtre de 7 jours).
 */
export function recoveryAlert(input: {
  today: string
  dailies: Record<string, DailyEntry>
  decliningCount: number
  upperDeclined: boolean
}): RecoveryAlert {
  const cfg = alertConfig
  let lowSleep = 0
  let lowEnergy = 0
  for (let i = 0; i < cfg.windowDays; i++) {
    const d = input.dailies[addDays(input.today, -i)]
    if (d?.sleep !== undefined && d.sleep <= cfg.lowScore) lowSleep++
    if (d?.energy !== undefined && d.energy <= cfg.lowScore) lowEnergy++
  }
  const signals: AlertSignal[] = []
  if (input.decliningCount >= cfg.loadDropExercises) signals.push('charges')
  if (lowSleep >= cfg.lowDays) signals.push('sommeil')
  if (lowEnergy >= cfg.lowDays) signals.push('energie')
  if (input.upperDeclined) signals.push('haut-en-baisse')

  const actions: RecoveryAlert['actions'] = []
  if (signals.includes('haut-en-baisse')) actions.push('retirer-series-maison-2')
  if (signals.some((s) => s !== 'haut-en-baisse')) actions.push('supprimer-maison-3', 'alleger-maison-2', 'salle-en-dernier')
  return { signals, actions }
}
