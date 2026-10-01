// Dates locales au format ISO court « AAAA-MM-JJ » (pas de fuseau, pas de dépendance).

const DAY_MS = 86_400_000

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

function utcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / DAY_MS
}

/** Nombre de jours de `from` à `to` (positif si `to` est après). */
export function diffDays(from: string, to: string): number {
  return Math.round(utcDay(to) - utcDay(from))
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** 1 = lundi … 7 = dimanche */
export function isoWeekday(iso: string): number {
  const wd = parseISODate(iso).getDay()
  return wd === 0 ? 7 : wd
}

/** Lundi de la semaine contenant `iso`. */
export function mondayOf(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso))
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const fullFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatShort = (iso: string): string => dateFmt.format(parseISODate(iso))
export const formatLong = (iso: string): string => longFmt.format(parseISODate(iso))
export const formatFull = (iso: string): string => fullFmt.format(parseISODate(iso))
