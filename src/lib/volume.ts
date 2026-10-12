// Volume par muscle : séries par semaine, prévues par la semaine type et faites (carnet).
// Une série compte 1 pour chaque muscle principal de l'exercice et ½ pour chaque muscle
// secondaire. Le cardio et la mobilité ne comptent pas (ce ne sont pas des séries de renforcement).
import { exercisesById } from '@/data/exercises'
import { MUSCLE_IDS, MUSCLES, type MuscleId } from '@/data/muscles'
import { sessionsById } from '@/data/sessions'
import type { Exercise, WeekDay } from '@/data/types'
import type { WorkoutLog } from './models'
import { exerciseSetCount, itemSetCount } from './plan'

export type Volume = Partial<Record<MuscleId, number>>

const counts = (exercise: Exercise) => exercise.kind !== 'cardio' && exercise.kind !== 'mobilite'

function add(volume: Volume, exercise: Exercise | undefined, sets: number) {
  if (!exercise || !sets || !counts(exercise)) return
  for (const id of exercise.primaryMuscles) if (id !== 'cardio') volume[id] = (volume[id] ?? 0) + sets
  for (const id of exercise.secondaryMuscles) {
    if (id !== 'cardio' && !exercise.primaryMuscles.includes(id)) volume[id] = (volume[id] ?? 0) + sets / 2
  }
}

/** Séries prévues sur une semaine type (jours optionnels compris si `withOptional`). */
export function plannedVolume(
  days: WeekDay[],
  opts: { deload?: boolean; resume?: boolean; withOptional?: boolean } = {},
): Volume {
  const volume: Volume = {}
  for (const day of days) {
    if (!day.sessionId || (day.optional && !opts.withOptional)) continue
    const session = sessionsById[day.sessionId]
    if (!session) continue
    for (const item of session.items) {
      const itemCount = itemSetCount(item, session, opts)
      for (const ie of item.exercises) add(volume, exercisesById[ie.exerciseId], exerciseSetCount(ie, item, itemCount))
    }
  }
  return volume
}

/** Séries validées dans les séances enregistrées (alternatives et exercices ajoutés compris). */
export function doneVolume(logs: WorkoutLog[]): Volume {
  const volume: Volume = {}
  for (const log of logs) {
    for (const e of log.exercises) add(volume, exercisesById[e.exerciseId], e.sets.filter((s) => s.done).length)
  }
  return volume
}

export type VolumeStatus = 'sous' | 'ok' | 'au-dessus' | 'libre'

export function volumeStatus(id: MuscleId, sets: number): VolumeStatus {
  const range = MUSCLES[id].weeklySets
  if (!range) return 'libre'
  if (sets < range[0]) return 'sous'
  if (sets > range[1]) return 'au-dessus'
  return 'ok'
}

export interface VolumeRow {
  id: MuscleId
  label: string
  planned: number
  done: number
  /** Moyenne des dernières semaines terminées (si fournie). */
  average?: number
  range?: readonly [number, number]
  status: VolumeStatus
}

/**
 * Une ligne par muscle travaillé (prévu, fait ou en moyenne), dans l'ordre de la liste des muscles.
 * Le repère est évalué sur la moyenne réelle quand elle est fournie, sinon sur le prévu.
 */
export function volumeRows(planned: Volume, done: Volume, average?: Volume): VolumeRow[] {
  const has = (v: Volume | undefined, id: MuscleId) => (v?.[id] ?? 0) > 0
  return MUSCLE_IDS.filter((id) => id !== 'cardio' && (has(planned, id) || has(done, id) || has(average, id))).map((id) => ({
    id,
    label: MUSCLES[id].short ?? MUSCLES[id].label,
    planned: planned[id] ?? 0,
    done: done[id] ?? 0,
    ...(average ? { average: average[id] ?? 0 } : {}),
    range: MUSCLES[id].weeklySets,
    status: volumeStatus(id, average ? (average[id] ?? 0) : (planned[id] ?? 0)),
  }))
}

/**
 * Moyenne par semaine des séries faites sur les `n` dernières semaines terminées du programme
 * (la semaine en cours est exclue : elle est incomplète). `weeks` = semaines prises en compte.
 */
export function recentAverage(logs: WorkoutLog[], currentWeek: number, n = 4): { volume: Volume; weeks: number } {
  const from = Math.max(1, currentWeek - n)
  const weeks = Math.max(0, currentWeek - from)
  const total = doneVolume(logs.filter((l) => l.programWeek >= from && l.programWeek < currentWeek))
  const volume: Volume = {}
  if (weeks) for (const id of MUSCLE_IDS) if (total[id]) volume[id] = total[id]! / weeks
  return { volume, weeks }
}

const sum = (v: Volume, ids: MuscleId[]) => ids.reduce((n, id) => n + (v[id] ?? 0), 0)

export interface BalanceAlert {
  id: 'pousser-tirer' | 'epaule-arriere' | 'ischios-quadriceps'
  text: string
}

/**
 * Déséquilibres classiques (seuils volontairement tolérants) :
 * - tirage < 80 % de la poussée (pectoraux + avant d'épaule vs grand dorsal + haut du dos) ;
 * - arrière d'épaule < 50 % de l'avant ;
 * - ischio-jambiers < 60 % des quadriceps.
 */
export function balanceAlerts(v: Volume): BalanceAlert[] {
  const alerts: BalanceAlert[] = []
  const push = sum(v, ['pectoraux', 'deltoides-anterieurs'])
  const pull = sum(v, ['grand-dorsal', 'haut-du-dos'])
  if (push > 0 && pull < push * 0.8) {
    alerts.push({ id: 'pousser-tirer', text: 'Plus de poussée que de tirage : ajoute du tirage (rowing, tirage vertical) pour protéger les épaules et la posture.' })
  }
  const front = v['deltoides-anterieurs'] ?? 0
  if (front > 0 && (v['deltoides-posterieurs'] ?? 0) < front * 0.5) {
    alerts.push({ id: 'epaule-arriere', text: 'L’arrière des épaules travaille peu par rapport à l’avant : ajoute oiseau ou face pull.' })
  }
  const quads = v.quadriceps ?? 0
  if (quads > 0 && (v['ischio-jambiers'] ?? 0) < quads * 0.6) {
    alerts.push({ id: 'ischios-quadriceps', text: 'Les ischio-jambiers travaillent peu par rapport aux quadriceps : ajoute leg curl ou soulevé de terre jambes tendues.' })
  }
  return alerts
}
