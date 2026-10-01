import { criteriaConfig, type CriteriaId } from '@/data/tracking'
import type { LoadType } from '@/data/types'
import { addDays, diffDays } from './dates'
import type { PerformanceEntry, WaistEntry, WeightEntry } from './models'
import { isProgress } from './progression'
import { weeklyLoss } from './weight'

export type PerfTrend = 'hausse' | 'baisse' | 'stable'

export interface ExerciseHistory {
  exerciseId: string
  loadType: LoadType
  entries: PerformanceEntry[] // chronologique, séances uniquement
}

/** Tendance des performances : on compare la dernière séance à celle d'il y a ~`windowDays` jours. */
export function performanceTrend(
  histories: ExerciseHistory[],
  today: string,
  windowDays = criteriaConfig.windowWeeks * 7,
): PerfTrend | null {
  let up = 0
  let down = 0
  let considered = 0
  const cutoff = addDays(today, -windowDays)
  for (const h of histories) {
    const logs = h.entries.filter((e) => e.source === 'seance' && e.date <= today)
    const recent = logs[logs.length - 1]
    const base = [...logs].reverse().find((e) => e.date <= cutoff)
    if (!recent || !base || recent === base) continue
    considered++
    if (isProgress(base, recent, h.loadType)) up++
    else if (isProgress(recent, base, h.loadType)) down++
  }
  if (!considered) return null
  if (up / considered > criteriaConfig.majority) return 'hausse'
  if (down / considered > criteriaConfig.majority) return 'baisse'
  return 'stable'
}

/**
 * Stagnation de l'entraînement : sur la majorité des exercices, aucune séance des
 * `days` derniers jours n'a progressé par rapport à la précédente.
 */
export function trainingStagnation(
  histories: ExerciseHistory[],
  today: string,
  days = criteriaConfig.trainingStagnationDays,
): { alert: boolean; stagnating: string[]; considered: number } {
  const stagnating: string[] = []
  let considered = 0
  for (const h of histories) {
    const logs = h.entries.filter((e) => e.source === 'seance')
    const inWindowIdx = logs
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => diffDays(e.date, today) >= 0 && diffDays(e.date, today) < days)
    const first = inWindowIdx[0]
    if (!first || first.i === 0) continue // pas d'historique avant la fenêtre
    considered++
    const base = logs[first.i - 1]!
    const progressed = inWindowIdx.some(({ e }) => isProgress(base, e, h.loadType))
    if (!progressed) stagnating.push(h.exerciseId)
  }
  return { alert: considered > 0 && stagnating.length / considered > criteriaConfig.majority, stagnating, considered }
}

export interface CriteriaResult {
  status: 'trop-tot' | 'donnees-insuffisantes' | 'evalue'
  lossPerWeek: number | null
  waistDelta: number | null
  perfTrend: PerfTrend | null
  matched: CriteriaId[]
}

function waistDelta(waists: WaistEntry[], today: string, weeks: number): number | null {
  const sorted = [...waists].filter((w) => w.date <= today).sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const cutoff = addDays(today, -7 * weeks)
  const base = [...sorted].reverse().find((w) => w.date <= cutoff)
  if (!latest || !base) return null
  return latest.cm - base.cm
}

/** Évalue les critères de modification du programme (à partir de la semaine 3, sur 2 semaines). */
export function evaluateCriteria(input: {
  programWeek: number
  today: string
  weights: WeightEntry[]
  waists: WaistEntry[]
  perfTrend: PerfTrend | null
}): CriteriaResult {
  const cfg = criteriaConfig
  const lossPerWeek = weeklyLoss(input.weights, input.today, cfg.windowWeeks)
  const wDelta = waistDelta(input.waists, input.today, cfg.windowWeeks)
  const base = { lossPerWeek, waistDelta: wDelta, perfTrend: input.perfTrend, matched: [] as CriteriaId[] }

  if (input.programWeek < cfg.fromWeek) return { ...base, status: 'trop-tot' }
  if (lossPerWeek === null) return { ...base, status: 'donnees-insuffisantes' }

  const matched: CriteriaId[] = []
  const waistStable = wDelta !== null && Math.abs(wDelta) < cfg.waistStableCm
  const waistDown = wDelta !== null && wDelta <= -cfg.waistStableCm
  const weightStable = Math.abs(lossPerWeek) < cfg.weightStableKgPerWeek

  if (weightStable && waistDown && input.perfTrend === 'hausse') matched.push('recomposition')
  else if (lossPerWeek < 0.4 && waistStable) matched.push('perte-lente')
  if (lossPerWeek >= 0.5 && lossPerWeek <= 1) matched.push('perte-ideale')
  if (lossPerWeek > 1.2 && input.perfTrend === 'baisse') matched.push('perte-rapide')

  return { ...base, matched, status: 'evalue' }
}
