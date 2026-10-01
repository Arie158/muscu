import { describe, expect, it } from 'vitest'
import { byPriority, decliningExercises, recoveryAlert, sessionsToKeep, skipOrder, upperSessionDeclined } from '@/lib/priority'
import { sessionsById } from '@/data/sessions'
import type { ExerciseHistory } from '@/lib/criteria'
import type { DailyEntry, PerformanceEntry, WorkoutLog } from '@/lib/models'

describe('priorité des séances', () => {
  it('salle d’abord (Bas A et Bas B en tête), puis Maison 2, Maison 1, Maison 3', () => {
    expect(byPriority(['maison-3', 'haut-a', 'maison-2', 'bas-b', 'maison-1', 'bas-a', 'haut-b'])).toEqual([
      'bas-a', 'bas-b', 'haut-a', 'haut-b', 'maison-2', 'maison-1', 'maison-3',
    ])
  })
  it('on saute dans l’ordre inverse : Maison 3 en premier', () => {
    expect(skipOrder().slice(0, 3)).toEqual(['maison-3', 'maison-1', 'maison-2'])
    expect(skipOrder().at(-1)).toBe('bas-a')
  })
  it('avec 4 créneaux on garde les 4 séances salle', () => {
    expect(sessionsToKeep(4)).toEqual(['bas-a', 'bas-b', 'haut-a', 'haut-b'])
    expect(sessionsToKeep(5).at(-1)).toBe('maison-2')
  })
  it('les niveaux de priorité des données sont cohérents', () => {
    expect(sessionsById['bas-a'].priority).toBe(1)
    expect(sessionsById['maison-2'].priority).toBe(2)
    expect(sessionsById['maison-1'].priority).toBe(3)
    expect(sessionsById['maison-3'].priority).toBe(4)
  })
})

const TODAY = '2026-10-11'
const perf = (date: string, load: number, reps: number[]): PerformanceEntry => ({
  date, machine: '', techniqueOk: true, source: 'seance',
  sets: reps.map((r) => ({ load, reps: r, rir: 2, done: true })),
})

describe('signaux d’alerte', () => {
  const dailies = (values: Partial<DailyEntry>[]): Record<string, DailyEntry> =>
    Object.fromEntries(values.map((v, i) => [`2026-10-${String(11 - i).padStart(2, '0')}`, v]))

  it('aucun signal quand tout va bien', () => {
    const r = recoveryAlert({ today: TODAY, dailies: dailies([{ sleep: 4, energy: 4 }, { sleep: 3, energy: 3 }]), decliningCount: 0, upperDeclined: false })
    expect(r.signals).toEqual([])
    expect(r.actions).toEqual([])
  })
  it('sommeil ≤ 2 sur plusieurs jours → supprimer Maison 3, puis alléger Maison 2, salle en dernier', () => {
    const r = recoveryAlert({ today: TODAY, dailies: dailies([{ sleep: 2 }, { sleep: 4 }, { sleep: 1 }]), decliningCount: 0, upperDeclined: false })
    expect(r.signals).toEqual(['sommeil'])
    expect(r.actions).toEqual(['supprimer-maison-3', 'alleger-maison-2', 'salle-en-dernier'])
  })
  it('un seul mauvais jour ne suffit pas', () => {
    const r = recoveryAlert({ today: TODAY, dailies: dailies([{ sleep: 1, energy: 2 }]), decliningCount: 0, upperDeclined: false })
    expect(r.signals).toEqual([])
  })
  it('énergie basse et charges en baisse', () => {
    const r = recoveryAlert({ today: TODAY, dailies: dailies([{ energy: 2 }, { energy: 2 }]), decliningCount: 2, upperDeclined: false })
    expect(r.signals).toEqual(['charges', 'energie'])
  })
  it('baisse le lundi ou le jeudi → retirer d’abord des séries à Maison 2', () => {
    const r = recoveryAlert({ today: TODAY, dailies: {}, decliningCount: 0, upperDeclined: true })
    expect(r.signals).toEqual(['haut-en-baisse'])
    expect(r.actions[0]).toBe('retirer-series-maison-2')
  })

  it('détecte les exercices de salle en baisse', () => {
    const h: ExerciseHistory[] = [
      { exerciseId: 'a', loadType: 'poids', entries: [perf('2026-10-01', 50, [8, 8]), perf('2026-10-08', 47.5, [8, 8])] },
      { exerciseId: 'b', loadType: 'poids', entries: [perf('2026-10-01', 50, [8, 8]), perf('2026-10-08', 50, [8, 9])] },
      { exerciseId: 'c', loadType: 'poids', entries: [perf('2026-09-01', 50, [8, 8]), perf('2026-09-08', 40, [8, 8])] }, // trop ancien
    ]
    expect(decliningExercises(h, TODAY)).toEqual(['a'])
  })

  it('détecte une séance Haut A en baisse sur la majorité des exercices', () => {
    const history: Record<string, PerformanceEntry[]> = {
      'developpe-couche': [perf('2026-09-28', 30, [8, 8, 8, 8]), perf('2026-10-05', 30, [6, 6, 6, 6])],
      'tirage-vertical': [perf('2026-09-28', 45, [10, 10]), perf('2026-10-05', 45, [9, 9])],
    }
    const log: WorkoutLog = {
      id: 'x', sessionId: 'haut-a', date: '2026-10-05', startedAt: 1, finishedAt: 2, programWeek: 4, location: 'gym', notes: '',
      exercises: Object.entries(history).map(([exerciseId, h]) => ({
        exerciseId, itemId: 'i', machine: '', techniqueOk: true, sets: h[1]!.sets,
      })),
    }
    const declined = upperSessionDeclined([log], (id) => history[id] ?? [], () => 'poids', TODAY)
    expect(declined).toBe(true)
  })
})
