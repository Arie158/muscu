import type { Tempo } from '@/data/home'
import type { HomeEquipment, Location, SessionId } from '@/data/types'

// Modèle des données saisies par l'utilisateur (persistées en localStorage).

export interface SetLog {
  /** kg (ou kg d'assistance) ; null pour les exercices sans charge. */
  load: number | null
  /** Répétitions, ou secondes pour un exercice chronométré. */
  reps: number | null
  rir: number | null
  done: boolean
}

export interface ExerciseLog {
  exerciseId: string
  itemId: string
  machine: string
  techniqueOk: boolean
  sets: SetLog[]
  /** Exercices maison : variante de matériel utilisée. */
  equipment?: HomeEquipment
  /** Exercices maison : vrais haltères utilisés (la double progression en kg s'applique). */
  dumbbells?: boolean
  /** Exercices maison : tempo utilisé (étape 2 de la progression maison). */
  tempo?: Tempo
  /** Exercices maison : niveau de charge libre (« 2 bouteilles », « élastique rouge »…). */
  level?: string
  /** Exercice prévu par le programme, si une alternative a été faite à la place (machine occupée). */
  plannedId?: string
  /** Exercice ajouté hors programme pendant la séance. */
  extra?: boolean
}

export interface WorkoutLog {
  id: string
  sessionId: SessionId
  date: string
  startedAt: number
  finishedAt: number
  programWeek: number
  /** Absent dans les données antérieures à la v2 (= salle). */
  location?: Location
  exercises: ExerciseLog[]
  notes: string
}

/** Une performance passée d'un exercice (séance enregistrée ou référence de départ). */
export interface PerformanceEntry {
  date: string
  machine: string
  sets: SetLog[]
  techniqueOk: boolean
  source: 'seance' | 'reference'
  equipment?: HomeEquipment
  dumbbells?: boolean
  tempo?: Tempo
  level?: string
}

export interface WeightEntry {
  date: string
  weight: number
}

export interface DailyEntry {
  weight?: number
  steps?: number
  sleep?: number
  energy?: number
  /** Séance maison du jour : faite, ou transformée en repos complet. */
  home?: 'faite' | 'repos'
}

export interface WaistEntry {
  date: string
  cm: number
}

export interface MeasurementEntry {
  date: string
  chest?: number
  arm?: number
  thigh?: number
  hips?: number
}

export interface CardioEntry {
  id: string
  date: string
  type: 'liss' | 'hiit'
  minutes: number
}
