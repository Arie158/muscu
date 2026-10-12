import { describe, expect, it } from 'vitest'
import { exercisesById } from '@/data/exercises'
import { MUSCLES } from '@/data/muscles'
import { sessionsById } from '@/data/sessions'
import { BODY_PARTS, bodyPartOf, exerciseBodyParts, sessionBodyParts } from '@/lib/muscles'

describe('parties du corps', () => {
  it('rattache chaque muscle à sa partie du corps', () => {
    expect(bodyPartOf('haut-du-dos').label).toBe('Dos')
    expect(bodyPartOf('deltoides-posterieurs').label).toBe('Épaules')
    expect(bodyPartOf('coiffe-rotateurs').label).toBe('Épaules')
    expect(bodyPartOf('obliques').label).toBe('Abdos')
    expect(bodyPartOf('flechisseurs-hanche').label).toBe('Hanches')
  })

  it('n’utilise que des muscles de la liste fixe, avec au moins un muscle principal', () => {
    for (const e of Object.values(exercisesById)) {
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) expect(MUSCLES, `${e.id} : ${m}`).toHaveProperty(m)
      expect(e.primaryMuscles.length, e.id).toBeGreaterThan(0)
      expect(BODY_PARTS).toContain(exerciseBodyParts(e).primary[0]!.label)
    }
  })

  it('ne répète pas en secondaire une partie déjà ciblée', () => {
    const { primary, secondary } = exerciseBodyParts(exercisesById['developpe-couche'] ?? Object.values(exercisesById)[0]!)
    const labels = primary.map((p) => p.label)
    for (const s of secondary) expect(labels).not.toContain(s.label)
  })

  it('résume chaque séance', () => {
    for (const s of Object.values(sessionsById)) expect(sessionBodyParts(s).length, s.id).toBeGreaterThan(0)
    const bas = sessionBodyParts(sessionsById['bas-a']).map((p) => p.label)
    expect(bas).toContain('Quadriceps')
  })
})
