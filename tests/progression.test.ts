import { describe, expect, it } from 'vitest'
import { detectStagnation, isProgress, suggestNext } from '@/lib/progression'
import { exercisesById } from '@/data/exercises'
import type { PerformanceEntry } from '@/lib/models'
import type { Target } from '@/data/types'

const entry = (date: string, load: number | null, reps: number[], techniqueOk = true): PerformanceEntry => ({
  date,
  machine: '',
  techniqueOk,
  source: 'seance',
  sets: reps.map((r) => ({ load, reps: r, rir: 2, done: true })),
})

const bench = exercisesById['developpe-couche']! // haut, base
const squat = exercisesById['squat-smith']! // bas, base
const lateral = exercisesById['elevations-laterales']! // haut, isolation
const dips = exercisesById['dips-assistes']! // assistance
const plank = exercisesById['planche']! // durée
const t68: Target = { kind: 'reps', min: 6, max: 8 }

describe('double progression', () => {
  it('suggère d’augmenter la charge (haut du corps) quand toutes les séries sont en haut de fourchette', () => {
    const s = suggestNext({ exercise: bench, target: t68, prescribedSets: 4, last: entry('2026-01-05', 30, [8, 8, 8, 8]) })
    expect(s.action).toBe('augmenter')
    expect(s.load).toBe(32.5)
    expect(s.targetReps).toBe(6)
  })

  it('utilise un incrément plus grand pour le bas du corps', () => {
    const s = suggestNext({ exercise: squat, target: t68, prescribedSets: 4, last: entry('2026-01-05', 60, [8, 8, 8, 8]) })
    expect(s.action).toBe('augmenter')
    expect(s.load).toBe(65)
  })

  it('utilise le plus petit cran pour les isolations', () => {
    const s = suggestNext({
      exercise: lateral, target: { kind: 'reps', min: 12, max: 15 }, prescribedSets: 3,
      last: entry('2026-01-05', 8, [15, 15, 15]),
    })
    expect(s.load).toBe(9)
  })

  it('demande des répétitions tant qu’une série est sous le haut de fourchette', () => {
    const s = suggestNext({ exercise: bench, target: t68, prescribedSets: 4, last: entry('2026-01-05', 30, [8, 8, 7, 6]) })
    expect(s.action).toBe('repetitions')
    expect(s.load).toBe(30)
    expect(s.targetReps).toBe(7)
  })

  it('n’augmente pas si la technique n’est pas propre', () => {
    const s = suggestNext({ exercise: bench, target: t68, prescribedSets: 4, last: entry('2026-01-05', 30, [8, 8, 8, 8], false) })
    expect(s.action).toBe('repetitions')
  })

  it('n’augmente pas si toutes les séries n’ont pas été faites', () => {
    const s = suggestNext({ exercise: bench, target: t68, prescribedSets: 4, last: entry('2026-01-05', 30, [8, 8, 8]) })
    expect(s.action).toBe('repetitions')
  })

  it('réduit l’assistance pour les dips assistés', () => {
    const s = suggestNext({
      exercise: dips, target: { kind: 'reps', min: 8, max: 12 }, prescribedSets: 3,
      last: entry('2026-01-05', 36, [12, 12, 12]),
    })
    expect(s.load).toBe(33.5)
  })

  it('ajoute du temps sur un exercice chronométré', () => {
    const s = suggestNext({
      exercise: plank, target: { kind: 'duree', min: 30, max: 45 }, prescribedSets: 3,
      last: entry('2026-01-05', null, [45, 45, 45]),
    })
    expect(s.action).toBe('augmenter')
    expect(s.targetReps).toBe(50)
  })

  it('part de la charge de référence au premier passage', () => {
    const ref: PerformanceEntry = {
      date: '', machine: 'Lat pulldown', techniqueOk: true, source: 'reference',
      sets: [{ load: 45, reps: null, rir: null, done: true }],
    }
    const s = suggestNext({ exercise: exercisesById['tirage-vertical']!, target: { kind: 'reps', min: 8, max: 10 }, prescribedSets: 4, last: ref })
    expect(s.action).toBe('reference')
    expect(s.load).toBe(45)
  })

  it('propose −10 % en cas de stagnation', () => {
    const s = suggestNext({ exercise: bench, target: t68, prescribedSets: 4, last: entry('2026-01-05', 30, [7, 7, 6, 6]), stagnating: true })
    expect(s.action).toBe('baisser')
    expect(s.load).toBe(27)
  })
})

describe('détection de stagnation', () => {
  it('compare charge puis volume', () => {
    expect(isProgress(entry('a', 30, [8, 8]), entry('b', 32.5, [6, 6]), 'poids')).toBe(true)
    expect(isProgress(entry('a', 30, [8, 7]), entry('b', 30, [8, 8]), 'poids')).toBe(true)
    expect(isProgress(entry('a', 30, [8, 8]), entry('b', 30, [8, 8]), 'poids')).toBe(false)
    expect(isProgress(entry('a', 36, [10]), entry('b', 34, [10]), 'assistance')).toBe(true)
  })

  it('détecte 3 séances de suite sans progression', () => {
    const h = [
      entry('2026-01-01', 30, [7, 7, 6, 6]),
      entry('2026-01-08', 30, [7, 7, 6, 6]),
      entry('2026-01-15', 30, [7, 6, 6, 6]),
      entry('2026-01-22', 30, [7, 7, 6, 6]),
    ]
    expect(detectStagnation(h, 'poids')).toBe(true)
  })

  it('ne signale rien si une des 3 dernières séances a progressé', () => {
    const h = [
      entry('2026-01-01', 30, [7, 7, 6, 6]),
      entry('2026-01-08', 30, [7, 7, 7, 6]),
      entry('2026-01-15', 30, [7, 7, 7, 6]),
      entry('2026-01-22', 30, [7, 7, 7, 6]),
    ]
    expect(detectStagnation(h, 'poids')).toBe(false)
  })

  it('une baisse volontaire de charge (−10 %) relance le compteur', () => {
    const h = [
      entry('2026-01-01', 30, [7, 7, 6, 6]),
      entry('2026-01-08', 30, [7, 7, 6, 6]),
      entry('2026-01-15', 30, [7, 7, 6, 6]),
      entry('2026-01-22', 30, [7, 7, 6, 6]),
      entry('2026-01-29', 27, [8, 8, 7, 7]),
      entry('2026-02-05', 27, [8, 8, 7, 7]),
    ]
    expect(detectStagnation(h.slice(0, 4), 'poids')).toBe(true)
    expect(detectStagnation(h, 'poids')).toBe(false)
  })

  it('exige au moins 4 séances enregistrées', () => {
    const h = [entry('2026-01-01', 30, [7]), entry('2026-01-08', 30, [7]), entry('2026-01-15', 30, [7])]
    expect(detectStagnation(h, 'poids')).toBe(false)
  })
})
