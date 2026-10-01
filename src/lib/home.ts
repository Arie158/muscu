import { EQUIPMENT_PREFERENCE, TEMPO_STEPS, type Tempo } from '@/data/home'
import { TIME_INCREMENT_S } from '@/data/progression'
import type { EquipmentVariant, Exercise, HomeEquipment, Target } from '@/data/types'
import type { PerformanceEntry } from './models'

/**
 * Choisit la variante de matériel d'un exercice maison selon le matériel disponible.
 * Préférence : élastique > charge improvisée > sans matériel. Si rien ne correspond,
 * on se replie sur la variante sans matériel, puis sur la première variante existante.
 * Renvoie null pour un exercice sans variantes (mobilité, cardio, planche).
 */
export function pickVariant(exercise: Exercise, available: HomeEquipment[]): HomeEquipment | null {
  const variants = exercise.variants
  if (!variants) return null
  const supported = EQUIPMENT_PREFERENCE.filter((e) => variants[e])
  return supported.find((e) => available.includes(e)) ?? (variants.none ? 'none' : (supported[0] ?? null))
}

export function variantOf(exercise: Exercise, equipment: HomeEquipment | null | undefined): EquipmentVariant | null {
  return equipment ? (exercise.variants?.[equipment] ?? null) : null
}

/** Cible effective : la variante peut remplacer la cible du programme (ex. isométrique en secondes). */
export function variantTarget(target: Target, variant: EquipmentVariant | null): Target {
  return variant?.target ?? target
}

/** La variante permet-elle d'augmenter la charge (étape 3) ? */
export const canAddLoad = (variant: EquipmentVariant | null): boolean => variant?.load === 'niveau'

const tempoIndex = (t: Tempo | undefined): number => Math.max(0, TEMPO_STEPS.findIndex((s) => s.id === (t ?? 'normal')))
export const MAX_TEMPO = TEMPO_STEPS.length - 1

export interface HomeSuggestion {
  /** 0 = première fois, puis étapes 1 à 4 de la progression maison. */
  step: 0 | 1 | 2 | 3 | 4
  title: string
  detail: string
  targetReps: number
  tempo: Tempo
}

function atTop(entry: PerformanceEntry, target: Target, prescribedSets: number): boolean {
  const done = entry.sets.filter((s) => s.done && s.reps !== null)
  return entry.techniqueOk && done.length >= prescribedSets && done.every((s) => (s.reps ?? 0) >= target.max)
}

/**
 * Progression des exercices maison, en 4 étapes (toujours à RIR 3) :
 * 1. ajouter des reps/secondes dans la fourchette ; 2. ralentir le tempo (3 s, puis 4 s + pause) ;
 * 3. augmenter la charge (si la variante en a une) ; 4. passer à la variante plus difficile.
 * L'étape 4 est proposée si la variante n'a pas de charge, ou si les deux dernières séances
 * ont été réussies au tempo le plus lent avec le même niveau de charge (charge non augmentable).
 *
 * `history` : séances de cet exercice avec la même variante, ordre chronologique.
 */
export function homeSuggestion(params: {
  target: Target
  prescribedSets: number
  variant: EquipmentVariant | null
  history: PerformanceEntry[]
}): HomeSuggestion {
  const { target, prescribedSets, variant, history } = params
  const unit = target.kind === 'duree' ? 's' : 'reps'
  const last = history[history.length - 1]

  if (!last) {
    return {
      step: 0, targetReps: target.min, tempo: 'normal',
      title: 'Première fois',
      detail: `Commence en bas de fourchette (${target.min} ${unit}) en gardant 3 répétitions en réserve.`,
    }
  }

  const lastTempo = tempoIndex(last.tempo)
  if (!atTop(last, target, prescribedSets)) {
    const done = last.sets.filter((s) => s.done && s.reps !== null)
    const weakest = done.length ? Math.min(...done.map((s) => s.reps ?? 0)) : target.min - 1
    const aim = Math.min(target.max, Math.max(target.min, weakest + (target.kind === 'duree' ? TIME_INCREMENT_S : 1)))
    return {
      step: 1, targetReps: aim, tempo: TEMPO_STEPS[lastTempo]!.id,
      title: 'Étape 1 : ajoute des répétitions',
      detail: `Même variante, même tempo : vise ${aim} ${unit}, jusqu’à ${target.max} sur toutes les séries. RIR 3.`,
    }
  }

  if (lastTempo < MAX_TEMPO) {
    const next = TEMPO_STEPS[lastTempo + 1]!
    return {
      step: 2, targetReps: target.min, tempo: next.id,
      title: 'Étape 2 : ralentis le tempo',
      detail: `Haut de fourchette atteint : passe au tempo « ${next.label} » et repars à ${target.min} ${unit}.`,
    }
  }

  const prev = history[history.length - 2]
  const loadStuck =
    !!prev && atTop(prev, target, prescribedSets) && tempoIndex(prev.tempo) === MAX_TEMPO && (prev.level ?? '') === (last.level ?? '')

  if (canAddLoad(variant) && !loadStuck) {
    return {
      step: 3, targetReps: target.min, tempo: 'normal',
      title: 'Étape 3 : augmente la charge',
      detail: `Plus de bouteilles, sac plus lourd ou élastique plus dur${last.level ? ` (actuel : ${last.level})` : ''}. Repars à ${target.min} ${unit}, tempo normal.`,
    }
  }

  return {
    step: 4, targetReps: target.min, tempo: 'normal',
    title: 'Étape 4 : passe à la variante plus difficile',
    detail: `${variant?.harder ?? 'Variante plus difficile'} — repars à ${target.min} ${unit}, tempo normal, RIR 3.`,
  }
}
