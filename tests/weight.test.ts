import { describe, expect, it } from 'vitest'
import { rollingAverage, rollingSeries, weeklyLoss } from '@/lib/weight'
import { addDays } from '@/lib/dates'
import type { WeightEntry } from '@/lib/models'

const series = (start: string, values: number[]): WeightEntry[] =>
  values.map((weight, i) => ({ date: addDays(start, i), weight }))

describe('moyenne glissante du poids', () => {
  it('fait la moyenne des 7 derniers jours inclus', () => {
    const entries = series('2026-01-01', [110, 109, 111, 110, 108, 109, 110, 100])
    // Au 7 janvier : jours 1 à 7
    expect(rollingAverage(entries, '2026-01-07')).toBeCloseTo((110 + 109 + 111 + 110 + 108 + 109 + 110) / 7)
    // Au 8 janvier : le 1er janvier sort de la fenêtre
    expect(rollingAverage(entries, '2026-01-08')).toBeCloseTo((109 + 111 + 110 + 108 + 109 + 110 + 100) / 7)
  })

  it('gère les jours sans pesée', () => {
    const entries: WeightEntry[] = [
      { date: '2026-01-01', weight: 110 },
      { date: '2026-01-04', weight: 108 },
    ]
    expect(rollingAverage(entries, '2026-01-07')).toBe(109)
    expect(rollingAverage(entries, '2026-01-08')).toBe(108)
  })

  it('ignore les pesées futures et renvoie null sans données', () => {
    const entries = series('2026-01-10', [100])
    expect(rollingAverage(entries, '2026-01-09')).toBeNull()
    expect(rollingAverage([], '2026-01-09')).toBeNull()
  })

  it('respecte le nombre minimal de pesées', () => {
    const entries = series('2026-01-01', [110, 109])
    expect(rollingAverage(entries, '2026-01-02', 7, 3)).toBeNull()
    expect(rollingAverage(entries, '2026-01-02', 7, 2)).toBe(109.5)
  })

  it('produit une série triée', () => {
    const s = rollingSeries([
      { date: '2026-01-02', weight: 108 },
      { date: '2026-01-01', weight: 110 },
    ])
    expect(s.map((p) => p.date)).toEqual(['2026-01-01', '2026-01-02'])
    expect(s[1]?.value).toBe(109)
  })
})

describe('perte hebdomadaire', () => {
  it('compare les moyennes 7 jours à 2 semaines d’écart', () => {
    // 21 jours, −0,1 kg/jour → −0,7 kg/semaine
    const entries = series('2026-01-01', Array.from({ length: 21 }, (_, i) => 110 - i * 0.1))
    expect(weeklyLoss(entries, '2026-01-21', 2)).toBeCloseTo(0.7)
  })
  it('renvoie null sans assez de données', () => {
    expect(weeklyLoss(series('2026-01-01', [110, 109]), '2026-01-21', 2)).toBeNull()
  })
})
