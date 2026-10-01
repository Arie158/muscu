import { blocks, DELOAD_VOLUME_FACTOR, PROGRAM_WEEKS, rirRules } from '@/data/plan'
import type { Exercise, ItemExercise, ProgramBlock, RirRule, Session, SessionItem, Target } from '@/data/types'
import { diffDays } from './dates'

/** Semaine de programme (1 = première semaine). ≤ 0 avant la date de début. */
export function programWeek(startDate: string, today: string): number {
  return Math.floor(diffDays(startDate, today) / 7) + 1
}

export function blockForWeek(week: number): ProgramBlock | null {
  return blocks.find((b) => week >= b.fromWeek && week <= b.toWeek) ?? null
}

export function rirForWeek(week: number): RirRule | null {
  return rirRules.find((r) => week >= r.fromWeek && week <= r.toWeek) ?? null
}

export type WeekStatus = 'avant' | 'en-cours' | 'termine'

export interface WeekInfo {
  week: number
  status: WeekStatus
  block: ProgramBlock | null
  rir: RirRule | null
  isDeload: boolean
  daysUntilStart: number
}

export function weekInfo(startDate: string, today: string): WeekInfo {
  const week = programWeek(startDate, today)
  const status: WeekStatus = week < 1 ? 'avant' : week > PROGRAM_WEEKS ? 'termine' : 'en-cours'
  const block = blockForWeek(week)
  return {
    week,
    status,
    block,
    rir: rirForWeek(week),
    isDeload: block?.deload ?? false,
    daysUntilStart: Math.max(0, -diffDays(startDate, today)),
  }
}

/** Nombre de séries à faire selon le contexte (décharge, mode reprise). */
export function effectiveSets(sets: number, opts: { deload?: boolean; resume?: boolean }): number {
  let n = sets
  if (opts.deload) n = Math.ceil(n * DELOAD_VOLUME_FACTOR)
  if (opts.resume) n = n - 1
  return Math.max(1, n)
}

/** Fourchette cible, éventuellement remplacée pour les mouvements de base (bloc 3 : 5-8 reps). */
export function effectiveTarget(target: Target, exercise: Exercise | undefined, block: ProgramBlock | null): Target {
  if (target.kind === 'reps' && exercise?.mainLift && block?.mainLiftReps) {
    return { kind: 'reps', ...block.mainLiftReps }
  }
  return target
}

/**
 * Nombre de séries/tours d'un bloc selon la séance :
 * - salle (séances principales) : décharge −40-50 % et mode reprise ;
 * - maison : `deloadSets` en décharge (Maison 2 : 3 → 2 tours), sinon inchangé ; pas de mode reprise.
 * - séances de secours : mode reprise uniquement.
 */
export function itemSetCount(
  item: SessionItem,
  session: Pick<Session, 'location' | 'category'>,
  opts: { deload?: boolean; resume?: boolean },
): number {
  if (session.location === 'home') return opts.deload && item.deloadSets ? item.deloadSets : item.sets
  if (session.category !== 'principale') return effectiveSets(item.sets, { resume: opts.resume })
  return effectiveSets(item.sets, opts)
}

/**
 * Séries d'un exercice dans un bloc. Un exercice peut en faire moins que le bloc
 * (curl + triceps sur 2 tours sur 3) ou plus (fente basse × 2 dans un tour de mobilité).
 */
export function exerciseSetCount(ie: ItemExercise, item: SessionItem, itemCount: number): number {
  if (ie.sets === undefined) return itemCount
  return ie.sets > item.sets ? ie.sets : Math.min(ie.sets, itemCount)
}
