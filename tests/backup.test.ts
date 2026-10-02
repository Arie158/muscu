import { describe, expect, it } from 'vitest'
import { exportReminder } from '@/lib/backup'

const base = { today: '2026-10-20', lastExportAt: null, snoozeUntil: null, dataCount: 10 }

describe('rappel de sauvegarde', () => {
  it('pas de rappel tant qu’il n’y a presque rien à perdre', () => {
    expect(exportReminder({ ...base, dataCount: 2 }).due).toBe(false)
  })
  it('rappel si jamais sauvegardé', () => {
    expect(exportReminder(base)).toEqual({ due: true, daysSince: null })
  })
  it('pas de rappel moins de 15 jours après une sauvegarde', () => {
    expect(exportReminder({ ...base, lastExportAt: '2026-10-06' })).toEqual({ due: false, daysSince: 14 })
  })
  it('rappel à partir de 15 jours', () => {
    expect(exportReminder({ ...base, lastExportAt: '2026-10-05' }).due).toBe(true)
  })
  it('« Plus tard » masque le rappel jusqu’à la date choisie incluse', () => {
    expect(exportReminder({ ...base, snoozeUntil: '2026-10-20' }).due).toBe(false)
    expect(exportReminder({ ...base, snoozeUntil: '2026-10-19' }).due).toBe(true)
  })
})
