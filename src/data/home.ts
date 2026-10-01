import type { HomeEquipment } from './types'

// Règles propres aux séances maison.

export const equipmentLabels: Record<HomeEquipment, { label: string; detail: string }> = {
  band: { label: 'Élastique', detail: 'Bande de résistance' },
  improvised: { label: 'Charge improvisée', detail: 'Sac à dos, bouteilles, pack d’eau' },
  none: { label: 'Aucun matériel', detail: 'Poids de corps' },
}

/** Ordre de préférence quand plusieurs matériels sont disponibles. */
export const EQUIPMENT_PREFERENCE: HomeEquipment[] = ['band', 'improvised', 'none']

/** Matériel coché par défaut dans les paramètres. */
export const DEFAULT_HOME_EQUIPMENT: HomeEquipment[] = ['band', 'improvised']

/** Échelle de tempo utilisée par la progression maison (étape 2). */
export const TEMPO_STEPS = [
  { id: 'normal', label: 'Normal' },
  { id: '3s', label: '3 s en descente' },
  { id: '4s-pause', label: '4 s + pause 1 s' },
] as const
export type Tempo = (typeof TEMPO_STEPS)[number]['id']

export const homeProgressionSteps = [
  { step: 1, title: 'Ajouter des répétitions ou des secondes', detail: 'Jusqu’au haut de la fourchette sur toutes les séries.' },
  { step: 2, title: 'Ralentir le tempo', detail: '3 s puis 4 s en descente, avec une pause d’1 s.' },
  { step: 3, title: 'Augmenter la charge', detail: 'Plus de bouteilles, sac plus lourd, élastique plus dur.' },
  { step: 4, title: 'Passer à la variante plus difficile', detail: 'Pompes plus basses, pont fessier à une jambe…' },
]

export const homeProgressionRules = [
  'Garder RIR 3 en permanence : ces séances ne doivent jamais dégrader la récupération pour la salle.',
  'Les exercices maison ne suivent pas la règle de charge de la salle (pas de kilos).',
  'Si tu utilises de vrais haltères, la double progression de la salle s’applique.',
]

/** Séries hebdomadaires ajoutées par Maison 2 (affiché dans la page Progression). */
export const homeVolume = [
  { group: 'Pectoraux', sets: 3, from: 'Pompes' },
  { group: 'Dos', sets: 3, from: 'Rowing maison' },
  { group: 'Épaules', sets: 3, from: 'Élévations latérales' },
]

export const HOME_DELOAD_NOTE = 'Séances maison en décharge : Maison 2 passe de 3 à 2 tours ; Maison 1 et Maison 3 inchangées.'

export const bandSafety = [
  'Tester l’ancrage en tirant fort avant chaque série.',
  'Inspecter l’élastique (fissures, usure) avant chaque usage.',
  'Ne pas l’utiliser s’il est abîmé.',
]

/** Seuils des signaux d'alerte de récupération. */
export const alertConfig = {
  /** Fenêtre d'observation (jours). */
  windowDays: 7,
  /** Nombre d'exercices salle en baisse pour parler de « charges en baisse ». */
  loadDropExercises: 2,
  /** Note de sommeil / énergie considérée comme basse (≤). */
  lowScore: 2,
  /** Nombre de jours bas dans la fenêtre pour déclencher l'alerte. */
  lowDays: 2,
}

export const alertActions = {
  general: [
    'Supprimer Maison 3 (repos complet).',
    'Puis alléger Maison 2 (2 tours au lieu de 3).',
    'Ne toucher aux séances salle qu’en dernier recours.',
  ],
  upperDrop: 'Performances en baisse le lundi ou le jeudi : retirer d’abord des séries à Maison 2.',
}
