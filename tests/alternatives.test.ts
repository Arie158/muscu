import { describe, expect, it } from 'vitest'
import { alternatives } from '@/data/alternatives'
import { exercisesById } from '@/data/exercises'
import { mainSessions } from '@/data/sessions'
import { alternativeOf, alternativesFor, swapOptions } from '@/lib/alternatives'
import { postponeInOrder } from '@/lib/plan'

describe('alternatives salle (machine occupée)', () => {
  it('ne référence que des exercices existants, jamais l’exercice lui-même', () => {
    for (const [id, list] of Object.entries(alternatives)) {
      expect(exercisesById[id], id).toBeDefined()
      for (const alt of list) {
        expect(exercisesById[alt], `${id} → ${alt}`).toBeDefined()
        expect(alt).not.toBe(id)
      }
    }
  })

  it('chaque exercice des 4 séances salle a au moins une alternative (sauf la planche)', () => {
    const ids = new Set(mainSessions.flatMap((s) => s.items.flatMap((i) => i.exercises.map((e) => e.exerciseId))))
    const missing = [...ids].filter((id) => id !== 'planche' && alternativesFor(id).length === 0)
    expect(missing).toEqual([])
  })

  it('une alternative travaille la même zone du corps', () => {
    for (const [id, list] of Object.entries(alternatives)) {
      for (const alt of list) expect(exercisesById[alt]!.region, `${id} → ${alt}`).toBe(exercisesById[id]!.region)
    }
  })

  it('propose l’exercice prévu en premier une fois remplacé, jamais l’exercice en cours', () => {
    expect(swapOptions('squat-smith', 'squat-smith').map((e) => e.id)).toEqual(['hack-squat', 'presse-cuisses'])
    expect(swapOptions('squat-smith', 'hack-squat').map((e) => e.id)).toEqual(['squat-smith', 'presse-cuisses'])
  })

  it('retrouve de quel exercice une alternative est le remplaçant', () => {
    expect(alternativeOf('hack-squat').map((e) => e.id)).toEqual(['squat-smith', 'presse-cuisses', 'presse-pieds-hauts'])
  })
})

describe('faire un exercice plus tard', () => {
  it('déplace le bloc en fin de séance', () => {
    expect(postponeInOrder([0, 1, 2, 3], 1)).toEqual([0, 2, 3, 1])
  })
  it('ne fait rien sur le dernier bloc', () => {
    expect(postponeInOrder([0, 1, 2], 2)).toBeNull()
  })
  it('fonctionne après plusieurs reports', () => {
    const once = postponeInOrder([0, 1, 2, 3], 0)!
    expect(postponeInOrder(once, 0)).toEqual([2, 3, 0, 1])
  })
})
