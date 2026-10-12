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
  /** Libellé court pour les tableaux (sinon `label`). */
  short?: string
  part: BodyPartLabel
  zone: BodyZone
  /**
   * Repère indicatif de séries par semaine (une série compte 1 pour un muscle principal,
   * ½ pour un muscle secondaire) : en dessous, le muscle risque d'être sous-stimulé ; au-dessus,
   * ce n'est pas une erreur mais la récupération devient le facteur limitant.
   * Absent : muscle suivi sans repère (stabilisateurs, mobilité).
   */
  weeklySets?: readonly [min: number, max: number]
}

const LIST = {
  pectoraux: { label: 'Pectoraux', part: 'Pectoraux', zone: 'haut', weeklySets: [10, 22] },
  'grand-dorsal': { label: 'Grand dorsal', part: 'Dos', zone: 'haut', weeklySets: [10, 22] },
  'haut-du-dos': { label: 'Haut du dos (rhomboïdes, trapèzes moyens)', short: 'Haut du dos', part: 'Dos', zone: 'haut', weeklySets: [8, 20] },
  trapezes: { label: 'Trapèzes', part: 'Trapèzes', zone: 'haut' },
  'deltoides-anterieurs': { label: 'Épaules, avant (deltoïdes antérieurs)', short: 'Épaules avant', part: 'Épaules', zone: 'haut' },
  'deltoides-lateraux': { label: 'Épaules, côté (deltoïdes latéraux)', short: 'Épaules côté', part: 'Épaules', zone: 'haut', weeklySets: [8, 20] },
  'deltoides-posterieurs': { label: 'Épaules, arrière (deltoïdes postérieurs)', short: 'Épaules arrière', part: 'Épaules', zone: 'haut', weeklySets: [6, 16] },
  'coiffe-rotateurs': { label: 'Coiffe des rotateurs', part: 'Épaules', zone: 'haut' },
  biceps: { label: 'Biceps', part: 'Biceps', zone: 'haut', weeklySets: [6, 20] },
  triceps: { label: 'Triceps', part: 'Triceps', zone: 'haut', weeklySets: [6, 20] },
  'avant-bras': { label: 'Avant-bras', part: 'Avant-bras', zone: 'haut' },
  abdominaux: { label: 'Abdominaux', part: 'Abdos', zone: 'tronc', weeklySets: [6, 20] },
  obliques: { label: 'Obliques', part: 'Abdos', zone: 'tronc' },
  lombaires: { label: 'Lombaires', part: 'Lombaires', zone: 'tronc' },
  'flechisseurs-hanche': { label: 'Fléchisseurs de hanche', short: 'Fléchisseurs hanche', part: 'Hanches', zone: 'bas' },
  quadriceps: { label: 'Quadriceps', part: 'Quadriceps', zone: 'bas', weeklySets: [10, 22] },
  'ischio-jambiers': { label: 'Ischio-jambiers', part: 'Ischio-jambiers', zone: 'bas', weeklySets: [10, 22] },
  fessiers: { label: 'Fessiers', part: 'Fessiers', zone: 'bas', weeklySets: [10, 22] },
  adducteurs: { label: 'Adducteurs', part: 'Adducteurs', zone: 'bas' },
  mollets: { label: 'Mollets', part: 'Mollets', zone: 'bas', weeklySets: [6, 16] },
  cardio: { label: 'Système cardiovasculaire', part: 'Cardio', zone: 'global' },
} as const satisfies Record<string, Muscle>

export type MuscleId = keyof typeof LIST

export const MUSCLES: Record<MuscleId, Muscle> = LIST

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[]
