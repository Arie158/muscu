// Exercice ajouté hors programme, pendant une séance (« Ajouter un exercice ») ou après coup depuis le carnet.
// Il n'existe pas dans la séance : on lui fabrique un bloc simple (séries, cible, repos)
// déduit de la nature de l'exercice. Fonctions pures.
import type { Exercise, HomeEquipment, SessionItem, Target } from '@/data/types'
import type { ExerciseLog } from './models'

/** Séries proposées par défaut (modifiables avec + / − Série). */
export const EXTRA_SETS = 3

/** Cible proposée : celle de la fiche, sinon selon la nature de l'exercice. */
export function extraTarget(exercise: Exercise): Target {
  if (exercise.defaultTarget) return exercise.defaultTarget
  if (exercise.kind === 'cardio') return { kind: 'minutes', min: 10, max: 20 }
  if (exercise.loadType === 'duree') return { kind: 'duree', min: 30, max: 45 }
  if (exercise.kind === 'mobilite') return { kind: 'reps', min: 6, max: 10 }
  if (exercise.kind === 'gainage') return { kind: 'reps', min: 10, max: 15 }
  if (exercise.kind === 'isolation') return { kind: 'reps', min: 10, max: 15 }
  return { kind: 'reps', min: 8, max: 12 }
}

/** Repos selon la nature : 2 min pour une base, 90 s pour une isolation, 60 s pour le gainage, aucun pour le cardio et la mobilité. */
function extraRest(exercise: Exercise): Pick<SessionItem, 'rest' | 'restLabel'> {
  if (exercise.kind === 'cardio' || exercise.kind === 'mobilite') return { rest: { min: 0, max: 0 }, restLabel: '' }
  if (exercise.kind === 'base') return { rest: { min: 120, max: 120 }, restLabel: '2 min' }
  if (exercise.kind === 'isolation') return { rest: { min: 90, max: 90 }, restLabel: '90 s' }
  return { rest: { min: 60, max: 60 }, restLabel: '60 s' }
}

/** Bloc d'un exercice ajouté : une activité (une seule « série » en minutes) pour le cardio, sinon un exercice seul. */
export function extraItem(exercise: Exercise, id: string): SessionItem {
  const target = extraTarget(exercise)
  const activity = exercise.kind === 'cardio'
  return {
    id,
    label: exercise.name,
    format: activity ? 'activite' : 'simple',
    sets: activity ? 1 : EXTRA_SETS,
    ...extraRest(exercise),
    cue: '',
    exercises: [{ exerciseId: exercise.id, target }],
  }
}

/**
 * Position d'insertion dans l'ordre de passage : juste après le bloc affiché
 * (l'étape `step` montre `order[step - 1]`), en fin de séance depuis le bilan, en premier depuis l'échauffement.
 */
export function insertPosition(step: number, orderLength: number): number {
  return Math.min(Math.max(step, 0), orderLength)
}

/**
 * Retire le bloc d'index `idx` (dans la séance) de l'ordre de passage
 * et renumérote les blocs suivants (leurs index baissent de 1).
 */
export function removeFromOrder(order: number[], idx: number): number[] {
  return order.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
}

/** Un exercice noté après coup se saisit en kg seulement s'il est chargé (salle, hors exercices maison). */
export function loggedWithKg(exercise: Exercise): boolean {
  return exercise.location !== 'home' && (exercise.loadType === 'poids' || exercise.loadType === 'assistance')
}

/**
 * Exercice ajouté après coup à une séance du carnet : les séries saisies (toutes faites),
 * sans RIR (inconnu après coup). `equipment` = variante de matériel pour un exercice maison.
 */
export function extraLog(
  exercise: Exercise,
  sets: { load: number | null; reps: number | null }[],
  opts: { itemId: string; equipment?: HomeEquipment | null },
): ExerciseLog {
  const kg = loggedWithKg(exercise)
  return {
    exerciseId: exercise.id,
    itemId: opts.itemId,
    machine: '',
    techniqueOk: true,
    extra: true,
    sets: sets
      .filter((s) => s.reps !== null && s.reps > 0)
      .map((s) => ({ load: kg ? s.load : null, reps: s.reps, rir: null, done: true })),
    ...(opts.equipment ? { equipment: opts.equipment } : {}),
  }
}
