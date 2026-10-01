import { describe, expect, it } from 'vitest'
import { migrateActive, migrateSettings, migrateWorkouts, runMigrations, SCHEMA_VERSION } from '@/lib/migrations'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
}

// Données telles qu'enregistrées par la v1 (avant les séances maison).
const v1Workouts = [
  {
    id: 'w1', sessionId: 'haut-a', date: '2026-09-28', startedAt: 1, finishedAt: 2, programWeek: 1, notes: '',
    exercises: [{ exerciseId: 'developpe-couche', itemId: 'ha-1', machine: '', techniqueOk: true, sets: [{ load: 30, reps: 8, rir: 3, done: true }] }],
  },
  {
    // Exercice maison sans variante enregistrée (cas d'une sauvegarde partielle) : élastique par défaut.
    id: 'w2', sessionId: 'maison-2', date: '2026-10-03', startedAt: 3, finishedAt: 4, programWeek: 1, notes: '',
    exercises: [{ exerciseId: 'pompes', itemId: 'm2-1', machine: '', techniqueOk: true, sets: [{ load: null, reps: 12, rir: 3, done: true }] }],
  },
]
const v1Settings = { startDate: '2026-09-28', startWeight: 110, goalWeight: 90, theme: 'dark', resumeUntil: null, sound: true }

describe('migration des données localStorage', () => {
  it('ajoute le lieu des séances et l’élastique par défaut aux exercices maison', () => {
    const out = migrateWorkouts(v1Workouts)
    expect(out).toHaveLength(2)
    expect(out[0]!.location).toBe('gym')
    expect(out[0]!.exercises[0]!.equipment).toBeUndefined()
    expect(out[0]!.exercises[0]!.sets).toEqual(v1Workouts[0]!.exercises[0]!.sets)
    expect(out[1]!.location).toBe('home')
    expect(out[1]!.exercises[0]!.equipment).toBe('band')
  })

  it('ajoute le matériel maison par défaut aux réglages sans toucher au reste', () => {
    const s = migrateSettings(v1Settings)
    expect(s.homeEquipment).toEqual(['band', 'improvised'])
    expect(s.startDate).toBe('2026-09-28')
    expect(migrateSettings({ ...v1Settings, homeEquipment: ['none'] }).homeEquipment).toEqual(['none'])
  })

  it('complète une séance en cours enregistrée en v1', () => {
    const a = migrateActive({ sessionId: 'haut-a', items: [{ itemId: 'ha-1', exercises: [{ exerciseId: 'developpe-couche', sets: [] }] }] }) as {
      items: { exercises: Record<string, unknown>[] }[]
    }
    expect(a.items[0]!.exercises[0]).toMatchObject({ exerciseId: 'developpe-couche', equipment: null, tempo: 'normal', level: '' })
  })

  it('migre le stockage une seule fois, sans perte d’historique', () => {
    const storage = new MemoryStorage()
    storage.setItem('ari:v1:workouts', JSON.stringify(v1Workouts))
    storage.setItem('ari:v1:settings', JSON.stringify(v1Settings))
    storage.setItem('ari:v1:tracking', JSON.stringify({ dailies: { '2026-10-01': { weight: 109.4 } } }))

    expect(runMigrations(storage)).toBe(1)
    expect(storage.getItem('ari:v1:schema')).toBe(String(SCHEMA_VERSION))
    const workouts = JSON.parse(storage.getItem('ari:v1:workouts')!)
    expect(workouts).toHaveLength(2)
    expect(workouts[1].exercises[0].equipment).toBe('band')
    expect(JSON.parse(storage.getItem('ari:v1:settings')!).homeEquipment).toEqual(['band', 'improvised'])
    // Les données de suivi ne sont pas touchées.
    expect(JSON.parse(storage.getItem('ari:v1:tracking')!).dailies['2026-10-01'].weight).toBe(109.4)

    // Idempotent : un second passage ne change rien.
    const snapshot = new Map(storage.data)
    expect(runMigrations(storage)).toBe(SCHEMA_VERSION)
    expect(storage.data).toEqual(snapshot)
  })

  it('fonctionne sur un stockage vide (première installation)', () => {
    const storage = new MemoryStorage()
    runMigrations(storage)
    expect(storage.getItem('ari:v1:workouts')).toBeNull()
    expect(storage.getItem('ari:v1:schema')).toBe(String(SCHEMA_VERSION))
  })

  it('ignore les entrées corrompues', () => {
    expect(migrateWorkouts('pas un tableau')).toEqual([])
    expect(migrateWorkouts([null, 3, v1Workouts[0]])).toHaveLength(1)
  })
})
