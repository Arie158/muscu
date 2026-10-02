import { diffDays } from './dates'

/** Intervalle conseillé entre deux sauvegardes (jours). */
export const EXPORT_EVERY_DAYS = 15
/** Durée pendant laquelle « Plus tard » masque le rappel (jours). */
export const EXPORT_SNOOZE_DAYS = 3

export interface ExportReminder {
  due: boolean
  /** Jours depuis la dernière sauvegarde, null si jamais sauvegardé. */
  daysSince: number | null
}

/**
 * Faut-il rappeler de sauvegarder ? Seulement s'il y a des données à perdre,
 * si la dernière sauvegarde date de plus de 15 jours (ou n'existe pas),
 * et si le rappel n'a pas été repoussé.
 */
export function exportReminder(input: {
  today: string
  lastExportAt: string | null
  snoozeUntil: string | null
  /** Nombre de séances enregistrées + jours de suivi saisis. */
  dataCount: number
}): ExportReminder {
  const daysSince = input.lastExportAt ? diffDays(input.lastExportAt, input.today) : null
  const enoughData = input.dataCount >= 3
  const stale = daysSince === null || daysSince >= EXPORT_EVERY_DAYS
  const snoozed = !!input.snoozeUntil && input.today <= input.snoozeUntil
  return { due: enoughData && stale && !snoozed, daysSince }
}
