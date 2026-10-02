import { describe, expect, it } from 'vitest'
import { blockVolume, firstOpenRow, isRowDone, rowCount, rowEntries, rowSummary, type RowExercise } from '@/lib/workoutRows'

const set = (load: number | null, reps: number, done = false, rir: number | null = 2) => ({ load, reps, rir, done })
const reps = (min: number, max: number) => ({ kind: 'reps' as const, min, max })

const bench: RowExercise = { exerciseId: 'b', target: reps(6, 8), sets: [set(30, 8, true), set(30, 8, true), set(30, 8), set(30, 8)] }
const kg = () => true

describe('lignes du mode séance', () => {
  it('compte les lignes et trouve la ligne en cours', () => {
    expect(rowCount([bench])).toBe(4)
    expect(firstOpenRow([bench])).toBe(2)
    expect(isRowDone([bench], 0)).toBe(true)
  })

  it('renvoie -1 quand tout est fait', () => {
    const done: RowExercise = { ...bench, sets: bench.sets.map((s) => ({ ...s, done: true })) }
    expect(firstOpenRow([done])).toBe(-1)
  })

  it('gère les exercices qui font moins de tours que le circuit', () => {
    const a: RowExercise = { exerciseId: 'a', target: reps(8, 15), sets: [set(null, 10), set(null, 10), set(null, 10)] }
    const curl: RowExercise = { exerciseId: 'c', target: reps(15, 15), sets: [set(null, 15), set(null, 15)] }
    expect(rowCount([a, curl])).toBe(3)
    expect(rowEntries([a, curl], 2).map((x) => x.ex.exerciseId)).toEqual(['a'])
  })

  it('résume une ligne repliée', () => {
    expect(rowSummary([bench], 0, kg)).toBe('30 kg × 8 · RIR 2')
    expect(rowSummary([bench], 2, kg)).toBe('30 kg × 8')
    const plank: RowExercise = { exerciseId: 'p', target: { kind: 'duree', min: 30, max: 45 }, sets: [set(null, 30)] }
    expect(rowSummary([plank], 0, () => false)).toBe('30 s')
  })

  it('résume un circuit de plus de 2 exercices par un compteur', () => {
    const many = ['a', 'b', 'c'].map((id, i): RowExercise => ({ exerciseId: id, target: reps(10, 10), sets: [set(null, 10, i === 0)] }))
    expect(rowSummary(many, 0, kg)).toBe('1 / 3 exercices')
  })

  it('décrit le volume du bloc', () => {
    expect(blockVolume('simple', [bench])).toBe('4 × 6-8')
    expect(blockVolume('activite', [{ exerciseId: 'm', target: { kind: 'minutes', min: 15, max: 20 }, sets: [set(null, 15)] }])).toBe('15-20 min')
  })
})
