import { describe, expect, it } from 'vitest'
import { exercisesById } from '@/data/exercises'
import { sessionsById } from '@/data/sessions'
import { homeSuggestion, pickVariant, variantOf, variantTarget } from '@/lib/home'
import { exerciseSetCount, itemSetCount, weekInfo } from '@/lib/plan'
import { dayPlan, weeklyRegularity } from '@/lib/week'
import type { PerformanceEntry, WorkoutLog } from '@/lib/models'
import type { Target } from '@/data/types'

describe('séance du jour (nouvelle semaine type)', () => {
  // Le 5 octobre 2026 est un lundi.
  const cases: [string, string, 'gym' | 'home'][] = [
    ['2026-10-05', 'haut-a', 'gym'],
    ['2026-10-06', 'bas-a', 'gym'],
    ['2026-10-07', 'maison-1', 'home'],
    ['2026-10-08', 'haut-b', 'gym'],
    ['2026-10-09', 'bas-b', 'gym'],
    ['2026-10-10', 'maison-2', 'home'],
    ['2026-10-11', 'maison-3', 'home'],
  ]
  it.each(cases)('%s → %s (%s)', (date, sessionId, location) => {
    const d = dayPlan(date)
    expect(d.sessionId).toBe(sessionId)
    expect(d.location).toBe(location)
    expect(sessionsById[d.sessionId].location).toBe(location)
  })
  it('Maison 3 est optionnelle, plus de jour de repos complet planifié', () => {
    expect(dayPlan('2026-10-11').optional).toBe(true)
    expect(sessionsById['maison-3'].optional).toBe(true)
  })
})

describe('décharge des séances maison', () => {
  const m2 = sessionsById['maison-2']
  const circuit = m2.items[0]!
  it('Maison 2 passe de 3 à 2 tours en décharge', () => {
    expect(itemSetCount(circuit, m2, { deload: false })).toBe(3)
    expect(itemSetCount(circuit, m2, { deload: true })).toBe(2)
  })
  it('le superset curl + triceps reste à 2 tours', () => {
    const curl = circuit.exercises.find((e) => e.exerciseId === 'curl-maison')!
    expect(exerciseSetCount(curl, circuit, 3)).toBe(2)
    expect(exerciseSetCount(curl, circuit, 2)).toBe(2)
    const pompes = circuit.exercises.find((e) => e.exerciseId === 'pompes')!
    expect(exerciseSetCount(pompes, circuit, 2)).toBe(2)
  })
  it('Maison 1 et Maison 3 sont inchangées', () => {
    for (const id of ['maison-1', 'maison-3'] as const) {
      const s = sessionsById[id]
      for (const item of s.items) expect(itemSetCount(item, s, { deload: true })).toBe(item.sets)
    }
  })
  it('la fente basse fait 2 passages dans un tour de mobilité', () => {
    const mob = sessionsById['maison-1'].items[1]!
    const fente = mob.exercises.find((e) => e.exerciseId === 'fente-basse')!
    expect(exerciseSetCount(fente, mob, 1)).toBe(2)
  })
  it('les semaines 7, 14 et 21 sont des décharges', () => {
    const start = '2026-01-05'
    for (const w of [7, 14, 21]) {
      const monday = new Date(2026, 0, 5 + (w - 1) * 7)
      const iso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
      expect(weekInfo(start, iso).isDeload).toBe(true)
    }
  })
  it('le mode reprise ne touche pas les séances maison', () => {
    expect(itemSetCount(circuit, m2, { resume: true })).toBe(3)
  })
})

describe('choix de la variante selon le matériel', () => {
  const pompes = exercisesById['pompes']!
  const facePull = exercisesById['face-pull-elastique']! // élastique ou sans matériel
  it('préfère l’élastique quand il est disponible (défaut)', () => {
    expect(pickVariant(pompes, ['band', 'improvised'])).toBe('band')
  })
  it('prend la charge improvisée sans élastique', () => {
    expect(pickVariant(pompes, ['improvised'])).toBe('improvised')
  })
  it('se replie sur la variante sans matériel', () => {
    expect(pickVariant(pompes, [])).toBe('none')
    expect(pickVariant(facePull, ['improvised'])).toBe('none')
  })
  it('renvoie null pour un exercice sans variantes', () => {
    expect(pickVariant(exercisesById['cat-cow']!, ['band'])).toBeNull()
    expect(pickVariant(exercisesById['planche']!, ['band'])).toBeNull()
  })
  it('applique la cible propre à une variante (isométrique en secondes)', () => {
    const lat = exercisesById['elevations-laterales-maison']!
    const t: Target = { kind: 'reps', min: 12, max: 15 }
    expect(variantTarget(t, variantOf(lat, 'none'))).toEqual({ kind: 'duree', min: 20, max: 30 })
    expect(variantTarget(t, variantOf(lat, 'band'))).toEqual(t)
  })
  it('chaque exercice maison a au plus 3 variantes, chacune avec son échelle', () => {
    for (const e of Object.values(exercisesById).filter((x) => x.variants)) {
      const vs = Object.values(e.variants!)
      expect(vs.length).toBeLessThanOrEqual(3)
      for (const v of vs) expect(v.easier && v.current && v.harder).toBeTruthy()
    }
  })
})

describe('progression maison en 4 étapes', () => {
  const target: Target = { kind: 'reps', min: 8, max: 15 }
  const band = variantOf(exercisesById['pompes']!, 'band')
  const none = variantOf(exercisesById['pompes']!, 'none')
  const entry = (reps: number[], tempo: PerformanceEntry['tempo'] = 'normal', level = 'élastique moyen'): PerformanceEntry => ({
    date: '2026-10-10', machine: '', techniqueOk: true, source: 'seance', equipment: 'band', tempo, level,
    sets: reps.map((r) => ({ load: null, reps: r, rir: 3, done: true })),
  })

  it('première fois : bas de fourchette', () => {
    expect(homeSuggestion({ target, prescribedSets: 3, variant: band, history: [] }).step).toBe(0)
  })
  it('étape 1 : ajouter des répétitions tant qu’on n’est pas en haut', () => {
    const s = homeSuggestion({ target, prescribedSets: 3, variant: band, history: [entry([12, 11, 10])] })
    expect(s.step).toBe(1)
    expect(s.targetReps).toBe(11)
  })
  it('étape 2 : ralentir le tempo (normal → 3 s → 4 s + pause)', () => {
    const a = homeSuggestion({ target, prescribedSets: 3, variant: band, history: [entry([15, 15, 15])] })
    expect(a.step).toBe(2)
    expect(a.tempo).toBe('3s')
    const b = homeSuggestion({ target, prescribedSets: 3, variant: band, history: [entry([15, 15, 15], '3s')] })
    expect(b.tempo).toBe('4s-pause')
  })
  it('étape 3 : augmenter la charge une fois le tempo le plus lent maîtrisé', () => {
    const s = homeSuggestion({ target, prescribedSets: 3, variant: band, history: [entry([15, 15, 15], '4s-pause')] })
    expect(s.step).toBe(3)
    expect(s.tempo).toBe('normal')
  })
  it('étape 4 : variante plus difficile si la charge n’a pas pu augmenter', () => {
    const h = [entry([15, 15, 15], '4s-pause'), entry([15, 15, 15], '4s-pause')]
    const s = homeSuggestion({ target, prescribedSets: 3, variant: band, history: h })
    expect(s.step).toBe(4)
    expect(s.detail).toContain(band!.harder)
  })
  it('étape 4 directement pour une variante sans charge', () => {
    const s = homeSuggestion({ target, prescribedSets: 3, variant: none, history: [entry([15, 15, 15], '4s-pause', '')] })
    expect(s.step).toBe(4)
  })
  it('ne progresse pas si la technique n’est pas propre', () => {
    const e = { ...entry([15, 15, 15]), techniqueOk: false }
    expect(homeSuggestion({ target, prescribedSets: 3, variant: band, history: [e] }).step).toBe(1)
  })
})

describe('régularité hebdomadaire', () => {
  const log = (date: string, sessionId: WorkoutLog['sessionId'], location: 'gym' | 'home'): WorkoutLog => ({
    id: date + sessionId, sessionId, date, startedAt: 0, finishedAt: 0, programWeek: 1, location, exercises: [], notes: '',
  })
  it('compte salle et maison, et exclut les repos choisis des séances prévues', () => {
    const logs = [log('2026-10-05', 'haut-a', 'gym'), log('2026-10-06', 'bas-a', 'gym'), log('2026-10-07', 'maison-1', 'home')]
    const dailies = { '2026-10-10': { home: 'faite' as const }, '2026-10-11': { home: 'repos' as const } }
    const [w] = weeklyRegularity(logs, dailies, '2026-10-11', 1)
    expect(w).toEqual({ monday: '2026-10-05', gym: 2, home: 2, homeRest: 1, homePlanned: 2 })
  })
})
