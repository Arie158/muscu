import type { SessionId } from './types'

export interface Contingency {
  id: string
  title: string
  steps: string[]
  sessions?: SessionId[]
  /** Propose d'activer le « mode reprise » (−10 % et 1 série de moins pendant 7 jours). */
  enablesResumeMode?: boolean
}

export const contingencies: Contingency[] = [
  {
    id: 'seance-manquee',
    title: 'J’ai manqué une séance',
    steps: [
      'Séance salle : la faire le lendemain et décaler la suite (elle passe avant la séance maison prévue ce jour-là).',
      'Jamais deux séances en une.',
      'Séance maison manquée : on ne la rattrape pas, on passe à la suite.',
    ],
  },
  {
    id: 'trois-seances',
    title: 'Seulement 3 séances salle dans la semaine',
    steps: [
      'Haut A, puis Bas A.',
      'Puis un mélange des deux séances B : 3 premiers exercices du Haut B + 2 premiers du Bas B.',
      'Les séances maison passent après, dans l’ordre de priorité (Maison 2, puis Maison 1, puis Maison 3).',
    ],
    sessions: ['haut-a', 'bas-a', 'mix-b'],
  },
  {
    id: 'manque-temps',
    title: 'Manque de temps ou d’énergie',
    steps: [
      'On saute dans l’ordre inverse de la priorité : Maison 3 d’abord, puis Maison 1, puis Maison 2.',
      'Les séances salle passent en dernier : Haut B, puis Haut A ; Bas A et Bas B sont les dernières à sauter.',
    ],
    sessions: ['maison-3', 'maison-1', 'maison-2'],
  },
  {
    id: 'arret-long',
    title: 'Plus d’une semaine d’arrêt',
    steps: ['Reprendre à −10 % sur les charges et 1 série de moins par exercice pendant une semaine.'],
    enablesResumeMode: true,
  },
  {
    id: 'semaine-chargee',
    title: 'Semaine chargée',
    steps: [
      '3 séances full body de 45-50 min, tout en RIR 1-2, repos 90 s à 2 min.',
      'Ordre : X, Y, X puis la semaine suivante Y, X, Y.',
      'Séances maison : seulement si l’énergie le permet, dans l’ordre de priorité.',
    ],
    sessions: ['full-x', 'full-y'],
  },
]

export const contingencyGolden = 'Dans tous les cas, garder les pas et l’alimentation.'

/** Durée du mode reprise (jours). */
export const RESUME_MODE_DAYS = 7
export const RESUME_LOAD_FACTOR = 0.9
