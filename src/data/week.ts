import type { WeekDay } from './types'

export const weekTemplate: WeekDay[] = [
  { weekday: 1, label: 'Lundi', sessionId: 'haut-a', location: 'gym', title: 'Haut A', detail: 'Force', duration: '1h15-1h30' },
  { weekday: 2, label: 'Mardi', sessionId: 'bas-a', location: 'gym', title: 'Bas A', detail: 'Quadriceps', duration: '1h15-1h30' },
  { weekday: 3, label: 'Mercredi', sessionId: 'maison-1', location: 'home', title: 'Maison 1', detail: 'Récupération active et gainage', duration: '35-40 min' },
  { weekday: 4, label: 'Jeudi', sessionId: 'haut-b', location: 'gym', title: 'Haut B', detail: 'Hypertrophie', duration: '1h15-1h30' },
  { weekday: 5, label: 'Vendredi', sessionId: 'bas-b', location: 'gym', title: 'Bas B', detail: 'Chaîne postérieure', duration: '1h15-1h30' },
  { weekday: 6, label: 'Samedi', sessionId: 'maison-2', location: 'home', title: 'Maison 2', detail: 'Conditionnement léger', duration: '45-50 min' },
  { weekday: 7, label: 'Dimanche', sessionId: 'maison-3', location: 'home', title: 'Maison 3', detail: 'Marche et mobilité', duration: '25-30 min', optional: true },
]

export const WEEK_RULES = [
  'Les 4 séances salle sont prioritaires. Garder l’ordre Haut A → Bas A → Haut B → Bas B.',
  'Jamais deux séances en une.',
  'Maison 3 est un repos actif optionnel : elle peut devenir un repos complet.',
]
