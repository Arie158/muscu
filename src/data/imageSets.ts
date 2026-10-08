// Quelles illustrations pré-charger à l'installation (hors ligne dès le premier lancement) ?
// → celles des exercices des séances du programme (salle, maison, secours) et de leurs variantes de matériel.
// Les alternatives « machine occupée » sont chargées à la demande et préchargées en arrière-plan ;
// les miniatures du catalogue (exercices hors programme) aussi, pour le panneau « Ajouter un exercice ».
// Extensions .ts explicites : importé aussi par vite.config.ts.
import { exercisesById } from './exercises.ts'
import { sessions } from './sessions.ts'
import { alternatives } from './alternatives.ts'
import { catalogExercises } from './catalog.ts'
import type { Exercise } from './types'

const illustrationIds = (e: Exercise): string[] => [
  e.illustration.dbId,
  ...Object.values(e.variants ?? {}).map((v) => v?.illustration?.dbId ?? null),
].filter((id): id is string => !!id)

const programExerciseIds = new Set(sessions.flatMap((s) => s.items.flatMap((i) => i.exercises.map((x) => x.exerciseId))))

/** Identifiants d'images (free-exercise-db) des exercices du programme. */
export const programImageIds: string[] = [
  ...new Set([...programExerciseIds].flatMap((id) => (exercisesById[id] ? illustrationIds(exercisesById[id]) : []))),
]

/** Identifiants d'images des alternatives qui ne sont pas déjà dans le programme. */
export const alternativeImageIds: string[] = [
  ...new Set(
    Object.values(alternatives)
      .flat()
      .flatMap((id) => (exercisesById[id] ? illustrationIds(exercisesById[id]) : [])),
  ),
].filter((id) => !programImageIds.includes(id))

/** Identifiants d'images du catalogue (exercices hors programme) qui ne sont pas déjà ci-dessus. */
export const catalogImageIds: string[] = [...new Set(catalogExercises.flatMap(illustrationIds))].filter(
  (id) => !programImageIds.includes(id) && !alternativeImageIds.includes(id),
)
