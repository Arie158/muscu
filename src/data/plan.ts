import type { ProgramBlock, RirRule } from './types'

export const PROGRAM_WEEKS = 26

export const blocks: ProgramBlock[] = [
  { id: 'bloc-1', name: 'Bloc 1', fromWeek: 1, toWeek: 6, deload: false,
    goal: 'Technique, calibrage, progression régulière' },
  { id: 'decharge-1', name: 'Décharge', fromWeek: 7, toWeek: 7, deload: true,
    goal: 'Volume −40-50 %, charges conservées ou −10 %' },
  { id: 'bloc-2', name: 'Bloc 2', fromWeek: 8, toWeek: 13, deload: false,
    goal: '+1 série sur 1 ou 2 groupes en retard (dos ou épaules par exemple)' },
  { id: 'decharge-2', name: 'Décharge', fromWeek: 14, toWeek: 14, deload: true,
    goal: 'Idem. Option : 1 à 2 semaines à maintenance calorique (pause diététique, décale l’objectif d’autant)' },
  { id: 'bloc-3', name: 'Bloc 3', fromWeek: 15, toWeek: 20, deload: false,
    goal: 'Mouvements de base en 5-8 reps, isolations inchangées',
    mainLiftReps: { min: 5, max: 8 } },
  { id: 'decharge-3', name: 'Décharge', fromWeek: 21, toWeek: 21, deload: true,
    goal: 'Idem' },
  { id: 'bloc-4', name: 'Bloc 4', fromWeek: 22, toWeek: 26, deload: false,
    goal: 'Consolidation, puis bilan complet et nouveau programme' },
]

/** Volume conservé en semaine de décharge (−40-50 % → on garde ~55 % des séries, arrondi au supérieur). */
export const DELOAD_VOLUME_FACTOR = 0.55

// Le programme précise le RIR des semaines 1 à 6. Décision : les blocs suivants
// reprennent la règle des semaines 3-6, et les décharges se font à RIR 3.
export const rirRules: RirRule[] = [
  { fromWeek: 1, toWeek: 2, base: 'RIR 3', isolation: 'RIR 3', defaultRir: 3,
    note: 'Calibrage : on apprend les mouvements et on trouve ses charges.' },
  { fromWeek: 3, toWeek: 6, base: 'RIR 1-2', isolation: 'RIR 0-1 sur la dernière série', defaultRir: 2,
    note: 'Jamais d’échec total sur squat, soulevé de terre roumain, développé couché.' },
  { fromWeek: 7, toWeek: 7, base: 'RIR 3', isolation: 'RIR 3', defaultRir: 3, note: 'Décharge : on récupère.' },
  { fromWeek: 8, toWeek: 13, base: 'RIR 1-2', isolation: 'RIR 0-1 sur la dernière série', defaultRir: 2,
    note: 'Jamais d’échec total sur squat, soulevé de terre roumain, développé couché.' },
  { fromWeek: 14, toWeek: 14, base: 'RIR 3', isolation: 'RIR 3', defaultRir: 3, note: 'Décharge : on récupère.' },
  { fromWeek: 15, toWeek: 20, base: 'RIR 1-2', isolation: 'RIR 0-1 sur la dernière série', defaultRir: 2,
    note: 'Bases en 5-8 reps. Jamais d’échec total sur squat, SDT roumain, développé couché.' },
  { fromWeek: 21, toWeek: 21, base: 'RIR 3', isolation: 'RIR 3', defaultRir: 3, note: 'Décharge : on récupère.' },
  { fromWeek: 22, toWeek: 26, base: 'RIR 1-2', isolation: 'RIR 0-1 sur la dernière série', defaultRir: 2,
    note: 'Consolidation. Jamais d’échec total sur squat, SDT roumain, développé couché.' },
]

export const CALIBRATION_WEEKS = 2
