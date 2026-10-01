import { weekTemplate } from '@/data/week'
import type { WeekDay } from '@/data/types'
import { addDays, isoWeekday, mondayOf } from './dates'
import type { DailyEntry, WorkoutLog } from './models'

/** Séance prévue à une date donnée selon la semaine type. */
export function dayPlan(iso: string): WeekDay {
  const wd = isoWeekday(iso)
  return weekTemplate.find((d) => d.weekday === wd)!
}

export interface WeekRegularity {
  monday: string
  gym: number
  home: number
  /** Séances maison transformées en repos complet (non comptées comme manquées). */
  homeRest: number
  /** Séances maison prévues, hors repos choisis. */
  homePlanned: number
}

/**
 * Régularité par semaine : séances salle enregistrées et séances maison faites
 * (séance enregistrée ou case « séance maison faite »). Un jour maison transformé
 * en repos complet n'est pas compté comme prévu.
 */
export function weeklyRegularity(
  logs: WorkoutLog[],
  dailies: Record<string, DailyEntry>,
  lastMonday: string,
  weeks: number,
): WeekRegularity[] {
  const out: WeekRegularity[] = []
  const homeDays = weekTemplate.filter((d) => d.location === 'home')
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = addDays(mondayOf(lastMonday), -7 * w)
    const sunday = addDays(monday, 6)
    const inWeek = logs.filter((l) => l.date >= monday && l.date <= sunday)
    const gym = inWeek.filter((l) => (l.location ?? 'gym') === 'gym').length
    const homeDates = new Set(inWeek.filter((l) => l.location === 'home').map((l) => l.date))
    let homeRest = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i)
      const flag = dailies[d]?.home
      if (flag === 'faite') homeDates.add(d)
      if (flag === 'repos') homeRest++
    }
    out.push({ monday, gym, home: homeDates.size, homeRest, homePlanned: homeDays.length - homeRest })
  }
  return out
}
