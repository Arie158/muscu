import { describe, expect, it } from 'vitest'
import { effectiveSets, effectiveTarget, programWeek, weekInfo } from '@/lib/plan'
import { exercisesById } from '@/data/exercises'
import { blocks } from '@/data/plan'

describe('semaine courante', () => {
  const start = '2026-01-05' // lundi
  it('commence à la semaine 1', () => {
    expect(programWeek(start, '2026-01-05')).toBe(1)
    expect(programWeek(start, '2026-01-11')).toBe(1)
    expect(programWeek(start, '2026-01-12')).toBe(2)
  })
  it('gère les dates avant le début et après la fin', () => {
    expect(weekInfo(start, '2026-01-01').status).toBe('avant')
    expect(weekInfo(start, '2026-01-01').daysUntilStart).toBe(4)
    expect(weekInfo(start, '2026-07-06').status).toBe('termine') // 26 semaines plus tard
    expect(weekInfo(start, '2026-07-05').week).toBe(26)
  })
  it('traverse correctement les changements d’heure', () => {
    expect(programWeek('2026-03-23', '2026-03-30')).toBe(2)
    expect(programWeek('2026-10-19', '2026-10-26')).toBe(2)
  })
})

describe('RIR cible et blocs', () => {
  const at = (week: number) => weekInfo('2026-01-05', ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26', '2026-02-02', '2026-02-09', '2026-02-16'][week - 1]!)
  it('RIR 3 en semaines 1-2', () => {
    expect(at(1).rir?.base).toBe('RIR 3')
    expect(at(2).rir?.defaultRir).toBe(3)
  })
  it('RIR 1-2 en semaines 3 à 6', () => {
    expect(at(3).rir?.base).toBe('RIR 1-2')
    expect(at(6).rir?.isolation).toContain('0-1')
  })
  it('semaine 7 = décharge', () => {
    expect(at(7).isDeload).toBe(true)
    expect(at(7).block?.name).toBe('Décharge')
  })
  it('les blocs couvrent les 26 semaines sans trou', () => {
    for (let w = 1; w <= 26; w++) expect(blocks.filter((b) => w >= b.fromWeek && w <= b.toWeek)).toHaveLength(1)
  })
})

describe('ajustements de volume', () => {
  it('réduit le volume en décharge et en reprise', () => {
    expect(effectiveSets(4, { deload: true })).toBe(3)
    expect(effectiveSets(3, { deload: true })).toBe(2)
    expect(effectiveSets(4, { resume: true })).toBe(3)
    expect(effectiveSets(1, { resume: true })).toBe(1)
  })
  it('passe les mouvements de base en 5-8 au bloc 3', () => {
    const bloc3 = blocks.find((b) => b.id === 'bloc-3')!
    const t = { kind: 'reps' as const, min: 6, max: 8 }
    expect(effectiveTarget(t, exercisesById['squat-smith'], bloc3)).toEqual({ kind: 'reps', min: 5, max: 8 })
    expect(effectiveTarget({ kind: 'reps', min: 12, max: 15 }, exercisesById['leg-extension'], bloc3)).toEqual({ kind: 'reps', min: 12, max: 15 })
  })
})
