import { describe, expect, it } from 'vitest'
import { evaluateCriteria, performanceTrend, trainingStagnation, type ExerciseHistory } from '@/lib/criteria'
import { addDays } from '@/lib/dates'
import type { PerformanceEntry, WeightEntry } from '@/lib/models'

const TODAY = '2026-03-01'

/** 21 jours de pesées se terminant aujourd'hui, avec une perte linéaire de `lossPerWeek`. */
const weights = (lossPerWeek: number): WeightEntry[] =>
  Array.from({ length: 21 }, (_, i) => ({ date: addDays(TODAY, i - 20), weight: 105 - (i * lossPerWeek) / 7 }))

const waists = (delta: number) => [
  { date: addDays(TODAY, -14), cm: 110 },
  { date: TODAY, cm: 110 + delta },
]

describe('critères de modification', () => {
  it('trop tôt avant la semaine 3', () => {
    const r = evaluateCriteria({ programWeek: 2, today: TODAY, weights: weights(0.2), waists: waists(0), perfTrend: null })
    expect(r.status).toBe('trop-tot')
    expect(r.matched).toEqual([])
  })

  it('données insuffisantes sans pesées', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: [], waists: [], perfTrend: null })
    expect(r.status).toBe('donnees-insuffisantes')
  })

  it('perte lente + tour de taille stable → réduire les calories ou ajouter des pas', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(0.2), waists: waists(0), perfTrend: 'stable' })
    expect(r.lossPerWeek).toBeCloseTo(0.2)
    expect(r.matched).toEqual(['perte-lente'])
  })

  it('perte lente mais tour de taille en baisse → pas de réduction', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(0.3), waists: waists(-1), perfTrend: 'stable' })
    expect(r.matched).toEqual([])
  })

  it('perte idéale → ne rien changer', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(0.7), waists: waists(-1), perfTrend: 'stable' })
    expect(r.matched).toEqual(['perte-ideale'])
  })

  it('perte rapide + performances en baisse → remonter les calories', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(1.5), waists: waists(-2), perfTrend: 'baisse' })
    expect(r.matched).toEqual(['perte-rapide'])
  })

  it('perte rapide mais performances qui tiennent → pas d’alerte', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(1.5), waists: waists(-2), perfTrend: 'hausse' })
    expect(r.matched).toEqual([])
  })

  it('poids stable, taille en baisse, charges en hausse → recomposition', () => {
    const r = evaluateCriteria({ programWeek: 5, today: TODAY, weights: weights(0), waists: waists(-1), perfTrend: 'hausse' })
    expect(r.matched).toEqual(['recomposition'])
  })
})

const perf = (date: string, load: number, reps: number[]): PerformanceEntry => ({
  date, machine: '', techniqueOk: true, source: 'seance',
  sets: reps.map((r) => ({ load, reps: r, rir: 2, done: true })),
})

describe('tendance et stagnation de l’entraînement', () => {
  const up: ExerciseHistory = {
    exerciseId: 'a', loadType: 'poids',
    entries: [perf('2026-02-01', 50, [8, 8]), perf('2026-02-15', 52.5, [8, 8]), perf('2026-02-28', 55, [8, 8])],
  }
  const flat: ExerciseHistory = {
    exerciseId: 'b', loadType: 'poids',
    entries: [perf('2026-02-01', 50, [8, 8]), perf('2026-02-16', 50, [8, 8]), perf('2026-02-23', 50, [8, 8]), perf('2026-02-28', 50, [8, 8])],
  }
  const flat2: ExerciseHistory = { ...flat, exerciseId: 'c' }

  it('détecte une tendance en hausse', () => {
    expect(performanceTrend([up], TODAY)).toBe('hausse')
  })
  it('stable quand la majorité ne bouge pas', () => {
    expect(performanceTrend([up, flat, flat2], TODAY)).toBe('stable')
  })
  it('alerte quand la majorité stagne depuis 2 semaines', () => {
    const r = trainingStagnation([up, flat, flat2], TODAY)
    expect(r.considered).toBe(3)
    expect(r.stagnating).toEqual(['b', 'c'])
    expect(r.alert).toBe(true)
  })
  it('pas d’alerte si la majorité progresse', () => {
    expect(trainingStagnation([up, flat], TODAY).alert).toBe(false)
  })
})
