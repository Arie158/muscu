import { addDays, diffDays } from './dates'
import type { WeightEntry } from './models'

/**
 * Moyenne glissante du poids sur `days` jours se terminant à `date` (incluse).
 * Renvoie null s'il y a moins de `minEntries` pesées dans la fenêtre.
 */
export function rollingAverage(entries: WeightEntry[], date: string, days = 7, minEntries = 1): number | null {
  const inWindow = entries.filter((e) => {
    const d = diffDays(e.date, date)
    return d >= 0 && d < days
  })
  if (inWindow.length < Math.max(1, minEntries)) return null
  return inWindow.reduce((s, e) => s + e.weight, 0) / inWindow.length
}

/** Série de moyennes glissantes calculée à chaque date de pesée (triée). */
export function rollingSeries(entries: WeightEntry[], days = 7): { date: string; value: number }[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((e) => ({ date: e.date, value: rollingAverage(sorted, e.date, days) as number }))
}

/**
 * Perte moyenne par semaine (kg/semaine, positive = perte) entre la moyenne 7 jours
 * d'il y a `weeks` semaines et la moyenne 7 jours actuelle.
 */
export function weeklyLoss(entries: WeightEntry[], today: string, weeks: number, minEntries = 3): number | null {
  const now = rollingAverage(entries, today, 7, minEntries)
  const then = rollingAverage(entries, addDays(today, -7 * weeks), 7, minEntries)
  if (now === null || then === null || weeks <= 0) return null
  return (then - now) / weeks
}

export const round1 = (n: number): number => Math.round(n * 10) / 10
