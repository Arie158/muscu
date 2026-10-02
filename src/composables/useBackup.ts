import { clearPhotos, exportPhotos, importPhotos, type PhotoExport } from '@/lib/photos'
import type { WorkoutLog } from '@/lib/models'
import { removeKey } from '@/lib/storage'
import { useSettingsStore, type Settings } from '@/stores/settings'
import { useTrackingStore, emptyTracking, type TrackingData } from '@/stores/tracking'
import { useWorkoutsStore, type References } from '@/stores/workouts'
import { useActiveStore } from '@/stores/active'
import { todayISO } from '@/lib/dates'
import { migrateSettings, migrateWorkouts } from '@/lib/migrations'

export const BACKUP_APP = 'programme-muscu-ari'
/** v2 : séances maison (variantes de matériel, niveau de charge). Les fichiers v1 restent importables. */
export const BACKUP_VERSION = 2

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  settings: Settings
  tracking: TrackingData
  workouts: WorkoutLog[]
  references: References
  photos?: PhotoExport[]
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Vérifie la forme générale d'un fichier de sauvegarde (lève une erreur lisible sinon). */
export function parseBackup(raw: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Le fichier n’est pas un JSON valide.')
  }
  if (!isObj(data) || data.app !== BACKUP_APP) throw new Error('Ce fichier ne provient pas de cette application.')
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) throw new Error('Version de sauvegarde non prise en charge.')
  if (!isObj(data.settings) || !isObj(data.tracking) || !Array.isArray(data.workouts)) throw new Error('Sauvegarde incomplète.')
  return data as unknown as BackupFile
}

export function useBackup() {
  const settings = useSettingsStore()
  const tracking = useTrackingStore()
  const workouts = useWorkoutsStore()
  const active = useActiveStore()

  /**
   * Exporte toutes les données en JSON.
   * Sur téléphone : feuille de partage du système (Fichiers, Drive, e-mail…), plus fiable que le
   * téléchargement, notamment sur iPhone quand l'app est installée. Sinon : téléchargement classique.
   * Renvoie 'annule' si l'utilisateur ferme la feuille de partage (la date de sauvegarde n'est pas mise à jour).
   */
  async function exportData(includePhotos: boolean): Promise<'partage' | 'telecharge' | 'annule'> {
    const today = todayISO()
    const data: BackupFile = {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      settings: { ...settings.settings, lastExportAt: today },
      tracking: tracking.data,
      workouts: workouts.logs,
      references: workouts.references,
      ...(includePhotos ? { photos: await exportPhotos() } : {}),
    }
    const name = `muscu-sauvegarde-${today}.json`
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const file = new File([blob], name, { type: 'application/json' })

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Sauvegarde muscu' })
        markExported(today)
        return 'partage'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'annule'
        // Partage refusé ou indisponible : on retombe sur le téléchargement.
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    markExported(today)
    return 'telecharge'
  }

  function markExported(today: string) {
    settings.settings.lastExportAt = today
    settings.settings.exportSnoozeUntil = null
  }

  async function importData(raw: string): Promise<BackupFile> {
    const file = parseBackup(raw)
    settings.replace(migrateSettings(file.settings) as Partial<Settings>)
    tracking.replace({ ...emptyTracking(), ...file.tracking })
    workouts.replace(migrateWorkouts(file.workouts), file.references)
    if (file.photos?.length) await importPhotos(file.photos)
    return file
  }

  async function resetAll(): Promise<void> {
    active.abandon()
    tracking.replace(emptyTracking())
    workouts.replace([])
    settings.replace({})
    for (const k of ['active', 'tracking', 'workouts', 'references', 'settings']) removeKey(k)
    try {
      await clearPhotos()
    } catch {
      /* IndexedDB indisponible */
    }
  }

  return { exportData, importData, resetAll }
}
