// Parties du corps travaillées : ramène les muscles détaillés des fiches
// (« Dos (rhomboïdes, trapèzes moyens) », « Mollets (soléaire) »…) à une liste
// courte et stable, affichable en étiquettes sur chaque exercice et chaque séance.
import type { Exercise, Session } from '@/data/types'
import { exercisesById } from '@/data/exercises'

export type BodyZone = 'haut' | 'tronc' | 'bas' | 'global'

export interface BodyPart {
  label: string
  zone: BodyZone
}

// Ordre important : le premier motif trouvé l'emporte (« Dos (… trapèzes moyens) » → Dos).
const RULES: [RegExp, BodyPart][] = [
  [/pectoraux/, { label: 'Pectoraux', zone: 'haut' }],
  [/dos|dorsal|rhombo|trapèzes moyens|colonne/, { label: 'Dos', zone: 'haut' }],
  [/trapèzes/, { label: 'Trapèzes', zone: 'haut' }],
  [/deltoïdes|épaule|rotateurs/, { label: 'Épaules', zone: 'haut' }],
  [/biceps|brachial/, { label: 'Biceps', zone: 'haut' }],
  [/triceps/, { label: 'Triceps', zone: 'haut' }],
  [/avant-bras/, { label: 'Avant-bras', zone: 'haut' }],
  [/abdominaux|obliques|transverse/, { label: 'Abdos', zone: 'tronc' }],
  [/lombaires/, { label: 'Lombaires', zone: 'tronc' }],
  [/fléchisseurs de hanche|hanches/, { label: 'Hanches', zone: 'bas' }],
  [/quadriceps/, { label: 'Quadriceps', zone: 'bas' }],
  [/ischio/, { label: 'Ischio-jambiers', zone: 'bas' }],
  [/fessiers/, { label: 'Fessiers', zone: 'bas' }],
  [/adducteurs/, { label: 'Adducteurs', zone: 'bas' }],
  [/mollets|soléaire|gastrocnémiens/, { label: 'Mollets', zone: 'bas' }],
  [/jambes/, { label: 'Jambes', zone: 'bas' }],
  [/cardio/, { label: 'Cardio', zone: 'global' }],
]

/** Toutes les parties du corps reconnues. */
export const BODY_PARTS: string[] = [...new Set(RULES.map(([, part]) => part.label))]

/** Partie du corps correspondant à un libellé de muscle (le libellé brut si inconnu). */
export function bodyPartOf(muscle: string): BodyPart {
  const m = muscle.toLowerCase()
  for (const [re, part] of RULES) if (re.test(m)) return part
  return { label: muscle, zone: 'global' }
}

function uniqueParts(muscles: string[], exclude: Set<string> = new Set()): BodyPart[] {
  const seen = new Set(exclude)
  const out: BodyPart[] = []
  for (const muscle of muscles) {
    const part = bodyPartOf(muscle)
    if (seen.has(part.label)) continue
    seen.add(part.label)
    out.push(part)
  }
  return out
}

/** Parties ciblées (principales) et sollicitées (secondaires, sans doublon avec les principales). */
export function exerciseBodyParts(exercise: Exercise): { primary: BodyPart[]; secondary: BodyPart[] } {
  const primary = uniqueParts(exercise.primaryMuscles)
  const secondary = uniqueParts(exercise.secondaryMuscles, new Set(primary.map((p) => p.label)))
  return { primary, secondary }
}

const ZONE_ORDER: BodyZone[] = ['haut', 'bas', 'tronc', 'global']

/**
 * Parties du corps ciblées par une séance (muscles principaux de ses exercices),
 * triées par zone puis par nombre d'exercices qui les ciblent.
 */
export function sessionBodyParts(session: Session): (BodyPart & { count: number })[] {
  const counts = new Map<string, BodyPart & { count: number }>()
  for (const item of session.items) {
    for (const ie of item.exercises) {
      const exercise = exercisesById[ie.exerciseId]
      if (!exercise) continue
      for (const part of exerciseBodyParts(exercise).primary) {
        const entry = counts.get(part.label) ?? { ...part, count: 0 }
        entry.count++
        counts.set(part.label, entry)
      }
    }
  }
  return [...counts.values()].sort(
    (a, b) => ZONE_ORDER.indexOf(a.zone) - ZONE_ORDER.indexOf(b.zone) || b.count - a.count,
  )
}
