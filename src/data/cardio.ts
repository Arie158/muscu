export const cardioPriority = 'Priorité : pas quotidiens > cardio léger > HIIT. La musculation passe toujours en premier.'

export const cardioPhases = [
  {
    title: 'Le LISS est intégré aux séances maison',
    items: [
      'Maison 1 (mercredi) : 15-20 min de cardio doux (marche rapide, vélo ou tapis).',
      'Maison 2 (samedi) : finisher de 15-20 min de LISS (marche rapide ou vélo).',
      'Maison 3 (dimanche) : 20-30 min de marche tranquille.',
      'Option à la salle : 10-20 min de LISS après Haut A ou Haut B (marche inclinée 8-12 %, 5-5,5 km/h, vélo ou elliptique).',
      'Intensité : on doit pouvoir parler.',
    ],
  },
  {
    title: 'À partir du mois 2 : HIIT optionnel',
    items: [
      'HIIT optionnel, 1 fois par semaine maximum : 8-10 × 30 s intenses / 90 s légères sur vélo ou rameur.',
      'Jamais la veille d’une séance Bas, et jamais pendant Maison 2.',
      'Pas de course intense au début (impact à 110 kg).',
    ],
  },
]

/** Total de cardio structuré visé par semaine (minutes). */
export const CARDIO_WEEKLY_MINUTES = { min: 60, max: 90 }

/** Semaine de programme à partir de laquelle le HIIT devient possible (mois 2). */
export const HIIT_FROM_WEEK = 5

export interface StepTarget {
  fromWeek: number
  toWeek: number
  /** null = semaine de mesure, on ne change rien. */
  target: number | null
  label: string
}

// « 10 000 vers la semaine 4-5 » : décision → 9 000 en semaine 4, 10 000 à partir de la semaine 5.
export const stepTargets: StepTarget[] = [
  { fromWeek: 1, toWeek: 1, target: null, label: 'Semaine 1 : mesurer sans rien changer' },
  { fromWeek: 2, toWeek: 3, target: 8000, label: '8 000 pas en moyenne' },
  { fromWeek: 4, toWeek: 4, target: 9000, label: 'Transition vers 10 000' },
  { fromWeek: 5, toWeek: 999, target: 10000, label: '10 000 pas en moyenne' },
]

export const STEPS_FLOOR = { min: 6000, max: 7000 }

export const stepsTips = [
  'Marche de 15-20 min à midi.',
  '3-5 min de marche toutes les 60-90 min.',
  'Appels téléphoniques debout.',
  'Prendre les escaliers.',
  'Descendre un arrêt plus tôt.',
]

export const stepsRule =
  'Raisonner en moyenne hebdomadaire. Plancher de 6 000-7 000 pas les mauvais jours. Les jours maison comptent dans l’objectif (marche et cardio doux inclus).'
