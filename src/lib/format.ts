import type { Target } from '@/data/types'

/** « 8-12 », « 30-45 s », « 15-20 min », suivi éventuellement de « / côté ». */
export function formatTarget(t: Target, perSide?: string): string {
  const range = `${t.min}${t.max !== t.min ? `-${t.max}` : ''}`
  const unit = t.kind === 'duree' ? ' s' : t.kind === 'minutes' ? ' min' : ''
  return `${range}${unit}${perSide ? ` / ${perSide}` : ''}`
}

export const targetUnit = (t: Target): string => (t.kind === 'duree' ? 's' : t.kind === 'minutes' ? 'min' : 'reps')
