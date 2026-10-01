import type { BodyRegion } from './types'

/** Incréments de charge de la double progression (kg). */
export const LOAD_INCREMENTS: Record<BodyRegion, { min: number; max: number; label: string }> = {
  haut: { min: 1, max: 2.5, label: '+1 à 2,5 kg (ou le plus petit cran)' },
  bas: { min: 2.5, max: 5, label: '+2,5 à 5 kg' },
  tronc: { min: 1, max: 2.5, label: 'le plus petit cran' },
  global: { min: 1, max: 2.5, label: 'le plus petit cran' },
}

/** Incrément de durée pour les exercices chronométrés (s). */
export const TIME_INCREMENT_S = 5

/** Nombre de séances consécutives sans progression avant de signaler une stagnation. */
export const STAGNATION_SESSIONS = 3
/** Baisse de charge conseillée en cas de stagnation. */
export const STAGNATION_DROP = 0.1

export const progressionText = {
  doubleProgression: [
    'Chaque exercice a une fourchette de répétitions (ex. 8-10).',
    'On ajoute des répétitions d’une séance à l’autre, à charge égale.',
    'Quand toutes les séries atteignent le haut de la fourchette avec une technique propre, on augmente la charge : haut du corps +1 à 2,5 kg (ou le plus petit cran), bas du corps +2,5 à 5 kg.',
    'On repart alors du bas de la fourchette et on recommence.',
    'Isolations (12-15 reps) : d’abord des répétitions, puis de la charge par petits crans.',
  ],
  rir: [
    'RIR = répétitions en réserve : combien de reps tu aurais encore pu faire proprement.',
    'Semaines 1-2 : RIR 3 (calibrage).',
    'Semaines 3 à 6 : RIR 1-2 sur les mouvements de base, RIR 0-1 sur la dernière série des isolations.',
    'Jamais d’échec total sur squat, soulevé de terre roumain, développé couché.',
  ],
  stagnation: [
    '3 séances de suite sans progression malgré un bon sommeil et une bonne alimentation → −10 % sur la charge, puis remonter.',
    'Si ça persiste, remplacer l’exercice par une variante.',
  ],
  volume: [
    '21-24 séries de travail par séance.',
    'Par semaine : ~12-16 séries pectoraux, dos, quadriceps ; 10-12 ischios et fessiers ; 9-12 épaules et bras en direct.',
  ],
  calibration: 'Les 2 premières semaines servent de calibrage (RIR 3) : les charges de départ sont des repères, ajuste-les librement.',
}
