import { alternatives } from '@/data/alternatives'
import { exercisesById } from '@/data/exercises'
import type { Exercise } from '@/data/types'

/** Alternatives d'un exercice du programme (exercices existants uniquement, sans doublon). */
export function alternativesFor(exerciseId: string): Exercise[] {
  return [...new Set(alternatives[exerciseId] ?? [])]
    .filter((id) => id !== exerciseId)
    .map((id) => exercisesById[id])
    .filter((e): e is Exercise => !!e)
}

/**
 * Options de remplacement pendant une séance : l'exercice prévu (si on l'a remplacé)
 * puis ses alternatives. `plannedId` = exercice prévu par le programme.
 */
export function swapOptions(plannedId: string, currentId: string): Exercise[] {
  const planned = exercisesById[plannedId]
  const list = [...(planned && plannedId !== currentId ? [planned] : []), ...alternativesFor(plannedId)]
  return list.filter((e) => e.id !== currentId)
}

/** Exercices du programme pour lesquels un exercice sert d'alternative (pour les fiches). */
export function alternativeOf(exerciseId: string): Exercise[] {
  return Object.entries(alternatives)
    .filter(([, list]) => list.includes(exerciseId))
    .map(([id]) => exercisesById[id])
    .filter((e): e is Exercise => !!e)
}
