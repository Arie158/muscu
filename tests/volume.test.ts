import { describe, expect, it } from 'vitest'
import { weekTemplate } from '@/data/week'
import type { WorkoutLog } from '@/lib/models'
import { balanceAlerts, doneVolume, plannedVolume, recentAverage, volumeRows, volumeStatus } from '@/lib/volume'

const set = (done = true) => ({ load: 20, reps: 10, rir: 2, done })
function log(programWeek: number, exercises: [string, number][]): WorkoutLog {
  return {
    id: `l${programWeek}-${exercises.length}`,
    sessionId: 'haut-a',
    date: '2026-10-05',
    startedAt: 0,
    finishedAt: 0,
    programWeek,
    exercises: exercises.map(([exerciseId, n]) => ({
      exerciseId,
      itemId: exerciseId,
      machine: '',
      techniqueOk: true,
      sets: [...Array.from({ length: n }, () => set()), set(false)],
    })),
    notes: '',
  }
}

describe('volume par muscle', () => {
  it('compte 1 par série pour un muscle principal, ½ pour un secondaire, seulement les séries validées', () => {
    // Développé couché : pectoraux en principal ; triceps et avant d'épaule en secondaire.
    const v = doneVolume([log(1, [['developpe-couche', 4]])])
    expect(v.pectoraux).toBe(4)
    expect(v.triceps).toBe(2)
    expect(v['deltoides-anterieurs']).toBe(2)
  })

  it('ignore le cardio et la mobilité', () => {
    expect(doneVolume([log(1, [['marche-tranquille', 3]])])).toEqual({})
  })

  it('calcule le prévu de la semaine type, réduit en décharge', () => {
    const normal = plannedVolume(weekTemplate)
    const deload = plannedVolume(weekTemplate, { deload: true })
    for (const id of ['pectoraux', 'grand-dorsal', 'quadriceps', 'ischio-jambiers', 'fessiers'] as const) {
      expect(normal[id], id).toBeGreaterThan(0)
      expect(deload[id]!, id).toBeLessThan(normal[id]!)
    }
    expect(normal.cardio).toBeUndefined()
  })

  it('la semaine type respecte les repères minimum et l’équilibre', () => {
    const rows = volumeRows(plannedVolume(weekTemplate), {})
    expect(rows.filter((r) => r.status === 'sous').map((r) => r.id)).toEqual([])
    expect(balanceAlerts(plannedVolume(weekTemplate))).toEqual([])
  })

  it('moyenne sur les dernières semaines terminées, sans la semaine en cours', () => {
    const logs = [log(3, [['developpe-couche', 4]]), log(4, [['developpe-couche', 2]]), log(5, [['developpe-couche', 10]])]
    const r = recentAverage(logs, 5, 2)
    expect(r.weeks).toBe(2)
    expect(r.volume.pectoraux).toBe(3)
    expect(recentAverage(logs, 1).weeks).toBe(0)
  })

  it('évalue le repère : bas, dans le repère, élevé, sans repère', () => {
    expect(volumeStatus('pectoraux', 4)).toBe('sous')
    expect(volumeStatus('pectoraux', 12)).toBe('ok')
    expect(volumeStatus('pectoraux', 30)).toBe('au-dessus')
    expect(volumeStatus('trapezes', 0)).toBe('libre')
  })

  it('signale les déséquilibres classiques', () => {
    const ids = balanceAlerts({ pectoraux: 12, 'deltoides-anterieurs': 6, 'grand-dorsal': 4, quadriceps: 12, 'ischio-jambiers': 3 }).map((a) => a.id)
    expect(ids).toEqual(['pousser-tirer', 'epaule-arriere', 'ischios-quadriceps'])
  })
})
