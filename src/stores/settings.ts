import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { profile } from '@/data/profile'
import { RESUME_MODE_DAYS } from '@/data/contingencies'
import { DEFAULT_HOME_EQUIPMENT } from '@/data/home'
import type { HomeEquipment } from '@/data/types'
import { addDays, mondayOf, todayISO } from '@/lib/dates'
import { weekInfo } from '@/lib/plan'
import { persistedRef } from '@/lib/storage'
import { useClock } from '@/composables/useClock'

export interface Settings {
  startDate: string
  startWeight: number
  goalWeight: number
  theme: 'dark' | 'light'
  /** Mode reprise actif jusqu'à cette date incluse (après plus d'une semaine d'arrêt). */
  resumeUntil: string | null
  sound: boolean
  /** Matériel disponible à la maison (choix de la variante des exercices maison). */
  homeEquipment: HomeEquipment[]
}

export const defaultSettings = (): Settings => ({
  startDate: mondayOf(todayISO()),
  startWeight: profile.startWeightKg,
  goalWeight: profile.goalWeightKg,
  theme: 'dark',
  resumeUntil: null,
  sound: true,
  homeEquipment: [...DEFAULT_HOME_EQUIPMENT],
})

export const useSettingsStore = defineStore('settings', () => {
  const settings = persistedRef<Settings>('settings', defaultSettings())
  const { today } = useClock()

  watchEffect(() => {
    document.documentElement.dataset.theme = settings.value.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.value.theme === 'dark' ? '#11151c' : '#f6f7f9')
  })

  const week = computed(() => weekInfo(settings.value.startDate, today.value))
  const resumeActive = computed(() => !!settings.value.resumeUntil && today.value <= settings.value.resumeUntil)

  function toggleTheme(): void {
    settings.value.theme = settings.value.theme === 'dark' ? 'light' : 'dark'
  }
  function startResumeMode(): void {
    settings.value.resumeUntil = addDays(today.value, RESUME_MODE_DAYS - 1)
  }
  function stopResumeMode(): void {
    settings.value.resumeUntil = null
  }
  function replace(next: Partial<Settings>): void {
    settings.value = { ...defaultSettings(), ...next }
  }

  return { settings, week, today, resumeActive, toggleTheme, startResumeMode, stopResumeMode, replace }
})
