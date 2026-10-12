// Parties du corps travaillées : chaque muscle des fiches (liste fixe, data/muscles.ts)
// appartient à une partie du corps, affichable en étiquettes sur chaque exercice et chaque séance.
import type { Exercise, Session } from '@/data/types'
import { exercisesById } from '@/data/exercises'
import { MUSCLES, type BodyPartLabel, type BodyZone, type MuscleId } from '@/data/muscles'

export type { BodyZone }

export interface BodyPart {
  label: BodyPartLabel
  zone: BodyZone
}

/** Toutes les parties du corps, dans l'ordre de la liste des muscles. */
export const BODY_PARTS: BodyPartLabel[] = [...new Set(Object.values(MUSCLES).map((m) => m.part))]

/** Partie du corps d'un muscle. */
export function bodyPartOf(id: MuscleId): BodyPart {
  const m = MUSCLES[id]
  return { label: m.part, zone: m.zone }
}

/** Libellés des muscles (fiche exercice, liste). */
export const muscleLabels = (ids: MuscleId[]): string => ids.map((id) => MUSCLES[id].label).join(', ')

function uniqueParts(muscles: MuscleId[], exclude: Set<string> = new Set()): BodyPart[] {
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

/** Parties ciblées et sollicitées sur l'ensemble d'une séance (pour le schéma du corps). */
export function sessionBodyMap(session: Session): { primary: string[]; secondary: string[] } {
  const primary = new Set<string>()
  const secondary = new Set<string>()
  for (const item of session.items) {
    for (const ie of item.exercises) {
      const exercise = exercisesById[ie.exerciseId]
      if (!exercise) continue
      const parts = exerciseBodyParts(exercise)
      parts.primary.forEach((p) => primary.add(p.label))
      parts.secondary.forEach((p) => secondary.add(p.label))
    }
  }
  return { primary: [...primary], secondary: [...secondary].filter((l) => !primary.has(l)) }
}
