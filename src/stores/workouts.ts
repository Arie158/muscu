import { defineStore } from 'pinia'
import { computed } from 'vue'
import { exercises, exercisesById } from '@/data/exercises'
import { SESSION_ORDER } from '@/data/sessions'
import type { HomeEquipment, SessionId, StartingReference } from '@/data/types'
import type { ExerciseHistory } from '@/lib/criteria'
import type { PerformanceEntry, WorkoutLog } from '@/lib/models'
import { detectStagnation } from '@/lib/progression'
import { persistedRef } from '@/lib/storage'

export type References = Record<string, StartingReference[]>

/** Charges de départ issues des données du programme. */
export const defaultReferences = (): References =>
  Object.fromEntries(exercises.filter((e) => e.startingRefs?.length).map((e) => [e.id, e.startingRefs!.map((r) => ({ ...r }))]))

export const useWorkoutsStore = defineStore('workouts', () => {
  const logs = persistedRef<WorkoutLog[]>('workouts', [])
  const references = persistedRef<References>('references', defaultReferences())

  const sortedLogs = computed(() => [...logs.value].sort((a, b) => a.startedAt - b.startedAt))

  /** Historique chronologique d'un exercice (séances enregistrées uniquement). */
  function historyFor(exerciseId: string): PerformanceEntry[] {
    const out: PerformanceEntry[] = []
    for (const log of sortedLogs.value) {
      for (const ex of log.exercises) {
        if (ex.exerciseId !== exerciseId || !ex.sets.some((s) => s.done)) continue
        out.push({
          date: log.date, machine: ex.machine, sets: ex.sets, techniqueOk: ex.techniqueOk, source: 'seance',
          equipment: ex.equipment, dumbbells: ex.dumbbells, tempo: ex.tempo, level: ex.level,
        })
      }
    }
    return out
  }

  /** Historique d'un exercice maison pour une variante de matériel (et avec ou sans vrais haltères). */
  function homeHistoryFor(exerciseId: string, equipment: HomeEquipment | null, dumbbells = false): PerformanceEntry[] {
    return historyFor(exerciseId).filter((h) => (h.equipment ?? null) === equipment && !!h.dumbbells === dumbbells)
  }

  function referenceEntry(exerciseId: string, machine?: string): PerformanceEntry | null {
    const refs = references.value[exerciseId] ?? []
    const ref = refs.find((r) => r.machine === machine) ?? refs[0]
    if (!ref) return null
    return {
      date: '', machine: ref.machine, techniqueOk: true, source: 'reference',
      sets: [{ load: ref.load, reps: null, rir: null, done: true }],
    }
  }

  /** Dernière performance (sur la même machine si possible), sinon charge de référence. */
  function lastPerformance(exerciseId: string, machine?: string): PerformanceEntry | null {
    const history = historyFor(exerciseId)
    if (machine) {
      const sameMachine = history.filter((h) => h.machine === machine)
      if (sameMachine.length) return sameMachine[sameMachine.length - 1]!
      const refs = references.value[exerciseId] ?? []
      if (refs.some((r) => r.machine === machine)) return referenceEntry(exerciseId, machine)
    }
    return history[history.length - 1] ?? referenceEntry(exerciseId, machine)
  }

  /** Machines connues pour un exercice (références + déjà utilisées). */
  function machinesFor(exerciseId: string): string[] {
    const set = new Set<string>((references.value[exerciseId] ?? []).map((r) => r.machine))
    for (const h of historyFor(exerciseId)) if (h.machine) set.add(h.machine)
    return [...set]
  }

  function isStagnating(exerciseId: string): boolean {
    const ex = exercisesById[exerciseId]
    return !!ex && detectStagnation(historyFor(exerciseId), ex.loadType)
  }

  const histories = computed<ExerciseHistory[]>(() =>
    exercises
      // Critères et alertes : exercices de salle uniquement (les séances maison ne suivent pas la règle de charge).
      .filter((e) => e.loadType !== 'duree' && e.location !== 'home')
      .map((e) => ({ exerciseId: e.id, loadType: e.loadType, entries: historyFor(e.id) }))
      .filter((h) => h.entries.length > 0),
  )

  /** Prochaine séance dans l'ordre Haut A → Bas A → Haut B → Bas B. */
  const nextInOrder = computed<SessionId>(() => {
    const last = [...sortedLogs.value].reverse().find((l) => SESSION_ORDER.includes(l.sessionId))
    if (!last) return SESSION_ORDER[0]!
    return SESSION_ORDER[(SESSION_ORDER.indexOf(last.sessionId) + 1) % SESSION_ORDER.length]!
  })

  function addLog(log: WorkoutLog): void {
    logs.value.push(log)
  }
  function removeLog(id: string): void {
    logs.value = logs.value.filter((l) => l.id !== id)
  }
  function setReferences(exerciseId: string, refs: StartingReference[]): void {
    references.value[exerciseId] = refs
  }
  function replace(nextLogs: WorkoutLog[], nextRefs?: References): void {
    logs.value = nextLogs
    references.value = nextRefs ?? defaultReferences()
  }

  return {
    logs, references, sortedLogs, histories, nextInOrder,
    historyFor, homeHistoryFor, lastPerformance, machinesFor, isStagnating, addLog, removeLog, setReferences, replace,
  }
})
