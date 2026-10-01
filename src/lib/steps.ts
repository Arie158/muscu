import { stepTargets, type StepTarget } from '@/data/cardio'
import { addDays } from './dates'
import type { DailyEntry } from './models'

export function stepTargetForWeek(week: number): StepTarget | null {
  return stepTargets.find((t) => week >= t.fromWeek && week <= t.toWeek) ?? null
}

/** Moyenne des pas saisis sur la semaine commençant le lundi `monday`. */
export function weekStepsAverage(dailies: Record<string, DailyEntry>, monday: string): { avg: number | null; days: number } {
  const values: number[] = []
  for (let i = 0; i < 7; i++) {
    const s = dailies[addDays(monday, i)]?.steps
    if (typeof s === 'number') values.push(s)
  }
  return { avg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null, days: values.length }
}
