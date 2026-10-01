// Protocole de suivi et critères de modification du programme.

export const trackingProtocol = [
  { what: 'Poids', when: 'Chaque matin, à jeun', note: 'Seule la moyenne de la semaine compte.' },
  { what: 'Tour de taille', when: 'Chaque semaine', note: 'Au niveau du nombril.' },
  { what: 'Mensurations', when: 'Toutes les 2 semaines', note: 'Poitrine, bras contracté, cuisse, hanches.' },
  { what: 'Photos', when: 'Toutes les 4 semaines', note: 'Face, profil, dos, même lumière.' },
  { what: 'Carnet de séances', when: 'À chaque séance', note: 'Exercice, machine, charge, reps, RIR.' },
  { what: 'Pas, sommeil, énergie', when: 'Chaque jour', note: 'Sommeil et énergie notés de 1 à 5.' },
]

export const TRACKING_INTERVALS_DAYS = { waist: 7, measurements: 14, photos: 28 }

export const measurementFields = [
  { key: 'chest', label: 'Poitrine' },
  { key: 'arm', label: 'Bras contracté' },
  { key: 'thigh', label: 'Cuisse' },
  { key: 'hips', label: 'Hanches' },
] as const

export const photoViews = [
  { key: 'face', label: 'Face' },
  { key: 'profil', label: 'Profil' },
  { key: 'dos', label: 'Dos' },
] as const

/** Seuils utilisés par la détection automatique des critères de modification. */
export const criteriaConfig = {
  /** Évaluation possible à partir de cette semaine de programme. */
  fromWeek: 3,
  /** Fenêtre d’analyse en semaines (le programme dit « sur 2 à 3 semaines »). */
  windowWeeks: 2,
  /** Variation de tour de taille (cm) sur la fenêtre en dessous de laquelle il est « stable ». */
  waistStableCm: 0.5,
  /** Variation de poids hebdo (kg) en dessous de laquelle le poids est « stable ». */
  weightStableKgPerWeek: 0.2,
  /** Part des exercices concernés pour parler de tendance des performances. */
  majority: 0.5,
  /** Fenêtre de stagnation de l’entraînement (jours). */
  trainingStagnationDays: 14,
}

export type CriteriaId = 'perte-lente' | 'perte-ideale' | 'perte-rapide' | 'recomposition'

export const modificationCriteria: { id: CriteriaId; situation: string; action: string; tone: 'ajuster' | 'ok' }[] = [
  { id: 'perte-lente', situation: 'Perte < 0,4 kg/semaine et tour de taille stable',
    action: '−150 à 200 kcal/jour ou +2 000 pas/jour', tone: 'ajuster' },
  { id: 'perte-ideale', situation: 'Perte entre 0,5 et 1 kg/semaine',
    action: 'Ne rien changer', tone: 'ok' },
  { id: 'perte-rapide', situation: 'Perte > 1,2 kg/semaine avec performances en baisse',
    action: '+150 à 200 kcal/jour', tone: 'ajuster' },
  { id: 'recomposition', situation: 'Poids stable mais tour de taille en baisse et charges en hausse',
    action: 'Ne rien changer (recomposition)', tone: 'ok' },
]

export const trainingCriteria = [
  { situation: 'Stagnation sur la majorité des exercices pendant 2 semaines', action: 'Avancer la décharge' },
  { situation: 'Douleur articulaire', action: 'Remplacer l’exercice immédiatement' },
]
