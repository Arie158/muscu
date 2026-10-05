import { describe, expect, it } from 'vitest'
import { exercisesById } from '@/data/exercises'
import { sessionsById } from '@/data/sessions'
import { BODY_PARTS, bodyPartOf, exerciseBodyParts, sessionBodyParts } from '@/lib/muscles'

describe('parties du corps', () => {
  it('ramène les libellés détaillés à une partie du corps', () => {
    expect(bodyPartOf('Dos (rhomboïdes, trapèzes moyens)').label).toBe('Dos')
    expect(bodyPartOf('Trapèzes supérieurs').label).toBe('Trapèzes')
    expect(bodyPartOf('Mollets (soléaire)').label).toBe('Mollets')
    expect(bodyPartOf('Rotateurs externes de l’épaule').label).toBe('Épaules')
    expect(bodyPartOf('Fléchisseurs de hanche (psoas)').label).toBe('Hanches')
  })

  it('reconnaît tous les muscles de toutes les fiches', () => {
    for (const e of Object.values(exercisesById)) {
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) {
        expect(BODY_PARTS, `${e.id} : ${m}`).toContain(bodyPartOf(m).label)
      }
      expect(exerciseBodyParts(e).primary.length, e.id).toBeGreaterThan(0)
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
