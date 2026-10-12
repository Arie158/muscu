// Liste fixe des muscles utilisés par les fiches exercices. Chaque muscle appartient à une
// partie du corps (étiquettes, filtre, schéma du corps) et peut avoir un repère de volume
// hebdomadaire (séries par semaine) pour le suivi du volume par muscle.

export type BodyZone = 'haut' | 'tronc' | 'bas' | 'global'

/** Parties du corps affichées (étiquettes, filtre de la liste d'exercices, schéma du corps). */
export type BodyPartLabel =
  | 'Pectoraux'
  | 'Dos'
  | 'Trapèzes'
  | 'Épaules'
  | 'Biceps'
  | 'Triceps'
  | 'Avant-bras'
  | 'Abdos'
  | 'Lombaires'
  | 'Hanches'
  | 'Quadriceps'
  | 'Ischio-jambiers'
  | 'Fessiers'
  | 'Adducteurs'
  | 'Mollets'
  | 'Cardio'

export interface Muscle {
  label: string
  part: BodyPartLabel
  zone: BodyZone
  /**
   * Repère indicatif de séries par semaine (une série compte 1 pour un muscle principal,
   * ½ pour un muscle secondaire). Absent : muscle suivi sans repère (stabilisateurs, mobilité).
   */
  weeklySets?: readonly [min: number, max: number]
}

export const MUSCLES = {
  pectoraux: { label: 'Pectoraux', part: 'Pectoraux', zone: 'haut', weeklySets: [10, 20] },
  'grand-dorsal': { label: 'Grand dorsal', part: 'Dos', zone: 'haut', weeklySets: [10, 20] },
  'haut-du-dos': { label: 'Haut du dos (rhomboïdes, trapèzes moyens)', part: 'Dos', zone: 'haut', weeklySets: [8, 16] },
  trapezes: { label: 'Trapèzes', part: 'Trapèzes', zone: 'haut' },
  'deltoides-anterieurs': { label: 'Épaules, avant (deltoïdes antérieurs)', part: 'Épaules', zone: 'haut' },
  'deltoides-lateraux': { label: 'Épaules, côté (deltoïdes latéraux)', part: 'Épaules', zone: 'haut', weeklySets: [8, 16] },
  'deltoides-posterieurs': { label: 'Épaules, arrière (deltoïdes postérieurs)', part: 'Épaules', zone: 'haut', weeklySets: [6, 14] },
  'coiffe-rotateurs': { label: 'Coiffe des rotateurs', part: 'Épaules', zone: 'haut' },
  biceps: { label: 'Biceps', part: 'Biceps', zone: 'haut', weeklySets: [6, 14] },
  triceps: { label: 'Triceps', part: 'Triceps', zone: 'haut', weeklySets: [6, 14] },
  'avant-bras': { label: 'Avant-bras', part: 'Avant-bras', zone: 'haut' },
  abdominaux: { label: 'Abdominaux', part: 'Abdos', zone: 'tronc', weeklySets: [6, 16] },
  obliques: { label: 'Obliques', part: 'Abdos', zone: 'tronc' },
  lombaires: { label: 'Lombaires', part: 'Lombaires', zone: 'tronc' },
  'flechisseurs-hanche': { label: 'Fléchisseurs de hanche', part: 'Hanches', zone: 'bas' },
  quadriceps: { label: 'Quadriceps', part: 'Quadriceps', zone: 'bas', weeklySets: [10, 20] },
  'ischio-jambiers': { label: 'Ischio-jambiers', part: 'Ischio-jambiers', zone: 'bas', weeklySets: [8, 16] },
  fessiers: { label: 'Fessiers', part: 'Fessiers', zone: 'bas', weeklySets: [8, 16] },
  adducteurs: { label: 'Adducteurs', part: 'Adducteurs', zone: 'bas' },
  mollets: { label: 'Mollets', part: 'Mollets', zone: 'bas', weeklySets: [6, 14] },
  cardio: { label: 'Système cardiovasculaire', part: 'Cardio', zone: 'global' },
} as const satisfies Record<string, Muscle>

export type MuscleId = keyof typeof MUSCLES

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[]

export const muscle = (id: MuscleId): Muscle => MUSCLES[id]
