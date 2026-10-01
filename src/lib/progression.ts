import { targetUnit } from './format'
import { LOAD_INCREMENTS, STAGNATION_DROP, STAGNATION_SESSIONS, TIME_INCREMENT_S } from '@/data/progression'
import type { Exercise, LoadType, Target } from '@/data/types'
import type { PerformanceEntry, SetLog } from './models'

/** Les trois dernières actions viennent de la progression maison (étapes 2 à 4). */
export type SuggestionAction = 'demarrer' | 'reference' | 'augmenter' | 'repetitions' | 'baisser' | 'tempo' | 'niveau' | 'variante'

export interface Suggestion {
  action: SuggestionAction
  /** Charge proposée (kg) ou null si sans charge / inconnue. */
  load: number | null
  /** Objectif de répétitions (ou secondes) par série. */
  targetReps: number
  title: string
  detail: string
}

export const roundHalf = (n: number): number => Math.round(n * 2) / 2

const doneSets = (sets: SetLog[]): SetLog[] => sets.filter((s) => s.done && s.reps !== null)

/** Charge « de travail » d'une séance : la plus lourde (ou la plus faible assistance). */
export function workingLoad(sets: SetLog[], loadType: LoadType): number | null {
  const loads = doneSets(sets)
    .map((s) => s.load)
    .filter((l): l is number => l !== null)
  if (!loads.length) return null
  return loadType === 'assistance' ? Math.min(...loads) : Math.max(...loads)
}

export function totalReps(sets: SetLog[]): number {
  return doneSets(sets).reduce((s, x) => s + (x.reps ?? 0), 0)
}

/** Vrai si toutes les séries prescrites sont faites en haut de la fourchette avec une technique propre. */
export function allSetsAtTop(entry: PerformanceEntry, target: Target, prescribedSets: number): boolean {
  const done = doneSets(entry.sets)
  return entry.techniqueOk && done.length >= prescribedSets && done.every((s) => (s.reps ?? 0) >= target.max)
}

/** Incrément conseillé : borne haute pour les mouvements de base, borne basse pour les isolations. */
export function loadIncrement(exercise: Exercise): number {
  const inc = LOAD_INCREMENTS[exercise.region]
  return exercise.kind === 'base' ? inc.max : inc.min
}

/** Règle de double progression : que faire à la prochaine séance ? */
export function suggestNext(params: {
  exercise: Exercise
  target: Target
  prescribedSets: number
  last: PerformanceEntry | null
  stagnating?: boolean
}): Suggestion {
  const { exercise, target, prescribedSets, last, stagnating } = params
  const unit = targetUnit(target)
  const range = `${target.min}${target.max !== target.min ? `-${target.max}` : ''} ${unit}`

  if (!last) {
    return {
      action: 'demarrer', load: null, targetReps: target.min,
      title: 'Première séance',
      detail: `Choisis une charge qui te laisse ~3 reps en réserve en bas de fourchette (${range}).`,
    }
  }

  const load = workingLoad(last.sets, exercise.loadType) ?? last.sets.find((s) => s.load !== null)?.load ?? null
  if (last.source === 'reference' || !doneSets(last.sets).length) {
    return {
      action: 'reference', load, targetReps: target.min,
      title: 'Charge de départ de référence',
      detail: `Calibrage : commence à ${load ?? '?'} kg et vise ${target.min} ${unit} avec ~3 reps en réserve. Ajuste librement.`,
    }
  }

  if (stagnating && load !== null && exercise.loadType !== 'duree') {
    const newLoad = exercise.loadType === 'assistance'
      ? roundHalf(load * (1 + STAGNATION_DROP))
      : roundHalf(load * (1 - STAGNATION_DROP))
    return {
      action: 'baisser', load: newLoad, targetReps: target.min,
      title: `Stagnation : ${exercise.loadType === 'assistance' ? '+10 % d’assistance' : '−10 % sur la charge'}`,
      detail: `${STAGNATION_SESSIONS} séances sans progrès. Repars à ${newLoad} kg puis remonte. Si ça persiste, remplace l’exercice par une variante (vérifie aussi sommeil et alimentation).`,
    }
  }

  if (allSetsAtTop(last, target, prescribedSets)) {
    if (exercise.loadType === 'duree') {
      return {
        action: 'augmenter', load: null, targetReps: target.max + TIME_INCREMENT_S,
        title: `Haut de fourchette atteint : +${TIME_INCREMENT_S} s`,
        detail: `Toutes les séries à ${target.max} s : allonge un peu ou passe à la variante plus difficile.`,
      }
    }
    if (exercise.loadType === 'poids-du-corps' || load === null) {
      return {
        action: 'augmenter', load, targetReps: target.min,
        title: 'Haut de fourchette atteint',
        detail: 'Ajoute un lest léger ou passe à la variante plus difficile, et repars du bas de la fourchette.',
      }
    }
    const inc = loadIncrement(exercise)
    const newLoad = exercise.loadType === 'assistance' ? Math.max(0, load - inc) : load + inc
    const rangeLabel = LOAD_INCREMENTS[exercise.region].label
    return {
      action: 'augmenter', load: newLoad, targetReps: target.min,
      title: exercise.loadType === 'assistance' ? 'Réduis l’assistance' : 'Augmente la charge',
      detail: exercise.loadType === 'assistance'
        ? `Toutes les séries en haut de fourchette : passe à ${newLoad} kg d’assistance et repars à ${target.min} reps.`
        : `Toutes les séries à ${target.max} ${unit} avec une technique propre : ${rangeLabel} → ${newLoad} kg, et repars à ${target.min} ${unit}.`,
    }
  }

  const done = doneSets(last.sets)
  const weakest = Math.min(...done.map((s) => s.reps ?? 0))
  const aim = Math.min(target.max, Math.max(target.min, weakest + (target.kind === 'duree' ? TIME_INCREMENT_S : 1)))
  return {
    action: 'repetitions', load, targetReps: aim,
    title: 'Même charge, plus de répétitions',
    detail: last.techniqueOk
      ? `Garde ${load ?? 'la même charge'}${load !== null ? ' kg' : ''} et ajoute des ${unit} jusqu’à ${target.max} sur toutes les séries (objectif ≈ ${aim}).`
      : 'Technique à consolider : garde la même charge et soigne l’exécution avant de progresser.',
  }
}

/** Vrai si `curr` est meilleure que `prev` (charge plus élevée, ou même charge et plus de reps). */
export function isProgress(prev: PerformanceEntry, curr: PerformanceEntry, loadType: LoadType): boolean {
  const pl = workingLoad(prev.sets, loadType)
  const cl = workingLoad(curr.sets, loadType)
  if (pl !== null && cl !== null && pl !== cl) {
    return loadType === 'assistance' ? cl < pl : cl > pl
  }
  return totalReps(curr.sets) > totalReps(prev.sets)
}

/** Vrai si la charge de travail a été volontairement réduite (ex. −10 % après stagnation). */
export function loadDropped(prev: PerformanceEntry, curr: PerformanceEntry, loadType: LoadType): boolean {
  const pl = workingLoad(prev.sets, loadType)
  const cl = workingLoad(curr.sets, loadType)
  if (pl === null || cl === null) return false
  return loadType === 'assistance' ? cl > pl : cl < pl
}

/**
 * Stagnation : aucune des `sessions` dernières séances enregistrées ne dépasse la séance
 * qui les précède (la « base »). Une baisse de charge volontaire relance le compteur.
 */
export function detectStagnation(
  history: PerformanceEntry[],
  loadType: LoadType,
  sessions: number = STAGNATION_SESSIONS,
): boolean {
  const logs = history.filter((h) => h.source === 'seance')
  let start = 0
  for (let i = 1; i < logs.length; i++) {
    if (loadDropped(logs[i - 1]!, logs[i]!, loadType)) start = i
  }
  const segment = logs.slice(start)
  if (segment.length < sessions + 1) return false
  const [base, ...recent] = segment.slice(-(sessions + 1))
  return recent.every((e) => !isProgress(base!, e, loadType))
}
