import { defineStore } from 'pinia'
import { computed } from 'vue'
import { persistedRef, uid } from '@/lib/storage'
import type { CardioEntry, DailyEntry, MeasurementEntry, WaistEntry, WeightEntry } from '@/lib/models'

export interface TrackingData {
  dailies: Record<string, DailyEntry>
  waists: WaistEntry[]
  measurements: MeasurementEntry[]
  cardio: CardioEntry[]
}

export const emptyTracking = (): TrackingData => ({ dailies: {}, waists: [], measurements: [], cardio: [] })

const byDate = <T extends { date: string }>(a: T, b: T): number => a.date.localeCompare(b.date)

export const useTrackingStore = defineStore('tracking', () => {
  const data = persistedRef<TrackingData>('tracking', emptyTracking())

  const weights = computed<WeightEntry[]>(() =>
    Object.entries(data.value.dailies)
      .filter(([, d]) => typeof d.weight === 'number')
      .map(([date, d]) => ({ date, weight: d.weight as number }))
      .sort(byDate),
  )
  const waists = computed(() => [...data.value.waists].sort(byDate))
  const measurements = computed(() => [...data.value.measurements].sort(byDate))

  function setDaily(date: string, patch: Partial<DailyEntry>): void {
    const current = { ...(data.value.dailies[date] ?? {}), ...patch }
    for (const k of Object.keys(current) as (keyof DailyEntry)[]) {
      if (current[k] === undefined || current[k] === null || Number.isNaN(current[k])) delete current[k]
    }
    if (Object.keys(current).length) data.value.dailies[date] = current
    else delete data.value.dailies[date]
  }

  function upsertByDate<T extends { date: string }>(list: T[], entry: T): void {
    const i = list.findIndex((e) => e.date === entry.date)
    if (i >= 0) list.splice(i, 1, entry)
    else list.push(entry)
  }

  const setWaist = (entry: WaistEntry) => upsertByDate(data.value.waists, entry)
  const removeWaist = (date: string) => (data.value.waists = data.value.waists.filter((w) => w.date !== date))
  const setMeasurement = (entry: MeasurementEntry) => upsertByDate(data.value.measurements, entry)
  const removeMeasurement = (date: string) =>
    (data.value.measurements = data.value.measurements.filter((m) => m.date !== date))

  function addCardio(entry: Omit<CardioEntry, 'id'>): void {
    data.value.cardio.push({ ...entry, id: uid() })
  }
  const removeCardio = (id: string) => (data.value.cardio = data.value.cardio.filter((c) => c.id !== id))

  /** Séance maison du jour : faite, transformée en repos complet, ou rien (null). */
  function setHomeDay(date: string, value: DailyEntry['home'] | null): void {
    setDaily(date, { home: value ?? undefined })
  }

  function replace(next: TrackingData): void {
    data.value = { ...emptyTracking(), ...next }
  }

  return {
    data, weights, waists, measurements,
    setDaily, setHomeDay, setWaist, removeWaist, setMeasurement, removeMeasurement, addCardio, removeCardio, replace,
  }
})
