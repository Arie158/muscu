import { defineStore } from 'pinia'
import { computed } from 'vue'
import { exercisesById } from '@/data/exercises'
import { sessionsById } from '@/data/sessions'
import { RESUME_LOAD_FACTOR } from '@/data/contingencies'
import type { Tempo } from '@/data/home'
import type { HomeEquipment, Location, SessionId, SessionItem, Target } from '@/data/types'
import { homeSuggestion, pickVariant, variantOf, variantTarget } from '@/lib/home'
import { effectiveTarget, exerciseSetCount, itemSetCount, postponeInOrder } from '@/lib/plan'
import { roundHalf, suggestNext, type Suggestion, type SuggestionAction } from '@/lib/progression'
import type { SetLog, WorkoutLog } from '@/lib/models'
import { persistedRef, uid } from '@/lib/storage'
import { useSettingsStore } from './settings'
import { useTrackingStore } from './tracking'
import { useWorkoutsStore } from './workouts'

export interface ActiveExercise {
  exerciseId: string
  /** Exercice prévu par le programme quand on a pris une alternative (machine occupée). */
  plannedId?: string
  machine: string
  techniqueOk: boolean
  /** Cible du programme (avant variante). */
  baseTarget?: Target
  basePerSide?: string
  /** Cible effective (variante éventuelle appliquée). */
  target: Target
  perSide?: string
  suggestion: Suggestion
  stagnating: boolean
  sets: SetLog[]
  /** Exercices maison. */
  equipment: HomeEquipment | null
  dumbbells: boolean
  tempo: Tempo
  level: string
}

export interface ActiveItem {
  itemId: string
  exercises: ActiveExercise[]
}

export interface RestState {
  /** Horodatage de fin (ms) quand le minuteur tourne. */
  endsAt: number | null
  /** Secondes restantes quand le minuteur est en pause. */
  pausedLeft: number | null
  total: number
  label: string
}

export interface ActiveSession {
  sessionId: SessionId
  location?: Location
  date: string
  startedAt: number
  programWeek: number
  deload: boolean
  resume: boolean
  defaultRir: number
  /** 0 = échauffement, 1..n = exercices, n+1 = bilan. */
  step: number
  /** Ordre de passage des blocs (index dans la séance) ; modifié par « faire plus tard ». */
  order?: number[]
  items: ActiveItem[]
  notes: string
  rest: RestState
}

/** Repos par défaut : milieu de la fourchette, arrondi à 15 s (ex. 2-3 min → 2 min 30). */
export const defaultRest = (item: SessionItem): number => Math.round((item.rest.min + item.rest.max) / 2 / 15) * 15

const idle = (): RestState => ({ endsAt: null, pausedLeft: null, total: 0, label: '' })

const HOME_STEP_ACTION: Record<number, SuggestionAction> = { 0: 'demarrer', 1: 'repetitions', 2: 'tempo', 3: 'niveau', 4: 'variante' }

/** Pas de RIR pour la mobilité et le cardio. */
const noRir = (exerciseId: string) => {
  const k = exercisesById[exerciseId]?.kind
  return k === 'mobilite' || k === 'cardio'
}

export const useActiveStore = defineStore('active', () => {
  const active = persistedRef<ActiveSession | null>('active', null)
  const settingsStore = useSettingsStore()
  const workouts = useWorkoutsStore()
  const tracking = useTrackingStore()

  const session = computed(() => (active.value ? sessionsById[active.value.sessionId] : null))
  const order = computed(() => active.value?.order ?? active.value?.items.map((_, i) => i) ?? [])
  /** Index (dans la séance) du bloc affiché à l'étape courante, ou -1 (échauffement / bilan). */
  const currentItemIdx = computed(() => {
    const a = active.value
    if (!a || a.step < 1 || a.step > a.items.length) return -1
    return order.value[a.step - 1] ?? a.step - 1
  })

  function adjustLoad(load: number | null, exerciseId: string, resume: boolean): number | null {
    if (load === null || !resume) return load
    const ex = exercisesById[exerciseId]
    return ex?.loadType === 'assistance' ? roundHalf(load / RESUME_LOAD_FACTOR) : roundHalf(load * RESUME_LOAD_FACTOR)
  }

  /** Charge en kg saisissable ? (salle, ou maison avec vrais haltères) */
  function usesKg(ex: ActiveExercise): boolean {
    const e = exercisesById[ex.exerciseId]
    if (!e) return false
    if (e.location === 'home') return ex.dumbbells
    return e.loadType === 'poids' || e.loadType === 'assistance'
  }

  /** Calcule cible, suggestion et réglages maison d'un exercice (sans toucher aux séries). */
  function plan(ex: ActiveExercise, setCount: number): void {
    const exercise = exercisesById[ex.exerciseId]!
    const baseTarget = ex.baseTarget ?? ex.target

    if (exercise.location !== 'home') {
      ex.stagnating = workouts.isStagnating(ex.exerciseId)
      ex.suggestion = suggestNext({
        exercise, target: ex.target, prescribedSets: setCount, stagnating: ex.stagnating,
        last: workouts.lastPerformance(ex.exerciseId, ex.machine || undefined),
      })
      return
    }

    const variant = variantOf(exercise, ex.equipment)
    ex.target = variantTarget(baseTarget, variant)
    ex.perSide = variant?.perSide ?? ex.basePerSide
    ex.stagnating = false

    if (exercise.kind === 'mobilite' || exercise.kind === 'cardio') {
      ex.suggestion = {
        action: 'demarrer', load: null, targetReps: ex.target.min,
        title: exercise.kind === 'cardio' ? 'Rythme où l’on peut parler' : 'Lent et sans douleur',
        detail: exercise.kind === 'cardio' ? 'Aucune recherche d’intensité : ça compte dans tes pas.' : 'Aucune progression à chercher : on bouge, on respire.',
      }
      return
    }

    if (ex.dumbbells) {
      // Vrais haltères : la double progression de la salle s'applique.
      const history = workouts.homeHistoryFor(ex.exerciseId, ex.equipment, true)
      ex.suggestion = suggestNext({
        exercise: { ...exercise, loadType: 'poids' }, target: ex.target, prescribedSets: setCount,
        last: history[history.length - 1] ?? null,
      })
      return
    }

    const history = workouts.homeHistoryFor(ex.exerciseId, ex.equipment, false)
    const hs = homeSuggestion({ target: ex.target, prescribedSets: setCount, variant, history })
    ex.suggestion = { action: HOME_STEP_ACTION[hs.step]!, load: null, targetReps: hs.targetReps, title: hs.title, detail: hs.detail }
    ex.tempo = hs.tempo
    ex.level = history[history.length - 1]?.level ?? ''
  }

  function freshSet(ex: ActiveExercise, rir: number, resume: boolean): SetLog {
    const load = usesKg(ex) ? adjustLoad(ex.suggestion.load, ex.exerciseId, resume) : null
    return { load, reps: ex.suggestion.targetReps, rir: noRir(ex.exerciseId) ? null : rir, done: false }
  }

  function start(sessionId: SessionId): void {
    const s = sessionsById[sessionId]
    const week = settingsStore.week
    const home = s.location === 'home'
    const deload = week.isDeload && (s.category === 'principale' || home)
    const resume = settingsStore.resumeActive && !home
    const defaultRir = home ? 3 : s.fixedRir ? 2 : (week.rir?.defaultRir ?? 2)

    const items: ActiveItem[] = s.items.map((item) => {
      const count = itemSetCount(item, s, { deload, resume })
      return {
        itemId: item.id,
        exercises: item.exercises.map((ie) => {
          const exercise = exercisesById[ie.exerciseId]!
          const target = s.category === 'principale' ? effectiveTarget(ie.target, exercise, week.block) : ie.target
          const isHome = exercise.location === 'home'
          const ex: ActiveExercise = {
            exerciseId: ie.exerciseId,
            machine: isHome ? '' : (workouts.lastPerformance(ie.exerciseId)?.machine ?? ''),
            techniqueOk: true, baseTarget: target, basePerSide: ie.perSide, target, perSide: ie.perSide,
            suggestion: { action: 'demarrer', load: null, targetReps: target.min, title: '', detail: '' },
            stagnating: false, sets: [],
            equipment: isHome ? pickVariant(exercise, settingsStore.settings.homeEquipment) : null,
            dumbbells: false, tempo: 'normal', level: '',
          }
          const n = exerciseSetCount(ie, item, count)
          plan(ex, n)
          ex.sets = Array.from({ length: n }, () => freshSet(ex, defaultRir, resume))
          return ex
        }),
      }
    })

    active.value = {
      sessionId, location: s.location, date: settingsStore.today, startedAt: Date.now(), programWeek: week.week,
      deload, resume, defaultRir, step: 0, order: items.map((_, i) => i), items, notes: '', rest: idle(),
    }
  }

  /**
   * Machine occupée : remplace l'exercice par une alternative pour cette séance.
   * Possible tant qu'aucune série de cet exercice n'est validée (historique propre à chaque exercice).
   */
  function swapExercise(itemIdx: number, exIdx: number, newId: string): boolean {
    const a = active.value
    const ex = a?.items[itemIdx]?.exercises[exIdx]
    if (!a || !ex || !exercisesById[newId] || ex.sets.some((s) => s.done)) return false
    const planned = ex.plannedId ?? ex.exerciseId
    ex.plannedId = newId === planned ? undefined : planned
    ex.exerciseId = newId
    ex.machine = workouts.lastPerformance(newId)?.machine ?? ''
    ex.techniqueOk = true
    replan(itemIdx, exIdx)
    return true
  }

  /** Faire ce bloc plus tard : il passe en fin de séance. Renvoie false s'il est déjà le dernier. */
  function postpone(): boolean {
    const a = active.value
    if (!a || a.step < 1 || a.step > a.items.length) return false
    const next = postponeInOrder(order.value, a.step - 1)
    if (!next) return false
    a.order = next
    return true
  }

  /** Saisie d'une série : la charge et les reps se reportent sur les séries suivantes non validées. */
  function updateSet(itemIdx: number, exIdx: number, setIdx: number, patch: Partial<Pick<SetLog, 'load' | 'reps' | 'rir'>>): void {
    const ex = active.value?.items[itemIdx]?.exercises[exIdx]
    const set = ex?.sets[setIdx]
    if (!ex || !set) return
    Object.assign(set, patch)
    for (const next of ex.sets.slice(setIdx + 1)) {
      if (next.done) continue
      if (patch.load !== undefined) next.load = patch.load
      if (patch.reps !== undefined) next.reps = patch.reps
    }
  }

  /** Recalcule la suggestion et pré-remplit à nouveau les séries non faites. */
  function replan(itemIdx: number, exIdx: number): void {
    const a = active.value
    const ex = a?.items[itemIdx]?.exercises[exIdx]
    if (!a || !ex) return
    plan(ex, ex.sets.length)
    const fresh = freshSet(ex, a.defaultRir, a.resume)
    for (const set of ex.sets) if (!set.done) Object.assign(set, { load: fresh.load, reps: fresh.reps })
  }

  /** Changement de machine (salle) : suggestion recalculée pour cette machine. */
  function changeMachine(itemIdx: number, exIdx: number, machine: string): void {
    const ex = active.value?.items[itemIdx]?.exercises[exIdx]
    if (!ex) return
    ex.machine = machine
    replan(itemIdx, exIdx)
  }

  /** Changement de variante de matériel en cours de séance (maison). */
  function changeVariant(itemIdx: number, exIdx: number, equipment: HomeEquipment): void {
    const ex = active.value?.items[itemIdx]?.exercises[exIdx]
    if (!ex || ex.equipment === equipment) return
    ex.equipment = equipment
    if (equipment !== 'improvised') ex.dumbbells = false
    replan(itemIdx, exIdx)
  }

  /** Vrais haltères (variante charge improvisée) : saisie en kg et double progression. */
  function setDumbbells(itemIdx: number, exIdx: number, value: boolean): void {
    const ex = active.value?.items[itemIdx]?.exercises[exIdx]
    if (!ex) return
    ex.dumbbells = value
    replan(itemIdx, exIdx)
  }

  /** Valide / dévalide une série. Renvoie true si tout le bloc est alors terminé. */
  function toggleDone(itemIdx: number, exIdx: number, setIdx: number): boolean {
    const a = active.value
    const item = a?.items[itemIdx]
    const set = item?.exercises[exIdx]?.sets[setIdx]
    if (!a || !item || !set) return false
    set.done = !set.done
    if (!set.done) return false
    // Report de la charge sur les séries suivantes non faites, pour une saisie plus rapide.
    for (const next of item.exercises[exIdx]!.sets.slice(setIdx + 1)) {
      if (!next.done) next.load = set.load
    }
    const allDone = item.exercises.every((e) => e.sets[setIdx]?.done ?? true)
    const sessionItem = session.value?.items[itemIdx]
    if (allDone && sessionItem && sessionItem.rest.max > 0) {
      const rows = Math.max(...item.exercises.map((e) => e.sets.length))
      const isLast = setIdx === rows - 1
      const unit = sessionItem.format === 'circuit' ? 'tour' : 'série'
      startRest(defaultRest(sessionItem), isLast ? 'Repos avant l’exercice suivant' : `Repos — ${unit} ${setIdx + 2} ensuite`)
    }
    return item.exercises.every((e) => e.sets.every((s) => s.done))
  }

  function addSet(itemIdx: number): void {
    const item = active.value?.items[itemIdx]
    if (!item) return
    for (const ex of item.exercises) {
      const last = ex.sets[ex.sets.length - 1]
      ex.sets.push({ load: last?.load ?? null, reps: last?.reps ?? null, rir: last?.rir ?? null, done: false })
    }
  }

  function removeSet(itemIdx: number): void {
    const item = active.value?.items[itemIdx]
    if (!item) return
    for (const ex of item.exercises) if (ex.sets.length > 1) ex.sets.pop()
  }

  // ── Minuteur de repos ──
  function startRest(seconds: number, label = 'Repos'): void {
    if (!active.value) return
    active.value.rest = { endsAt: Date.now() + seconds * 1000, pausedLeft: null, total: seconds, label }
  }
  function addRest(delta: number): void {
    const r = active.value?.rest
    if (!r) return
    if (r.endsAt) r.endsAt = Math.max(Date.now(), r.endsAt + delta * 1000)
    else if (r.pausedLeft !== null) r.pausedLeft = Math.max(0, r.pausedLeft + delta)
    r.total = Math.max(0, r.total + delta)
  }
  function pauseRest(): void {
    const r = active.value?.rest
    if (!r?.endsAt) return
    r.pausedLeft = Math.max(0, Math.round((r.endsAt - Date.now()) / 1000))
    r.endsAt = null
  }
  function resumeRest(): void {
    const r = active.value?.rest
    if (!r || r.pausedLeft === null) return
    r.endsAt = Date.now() + r.pausedLeft * 1000
    r.pausedLeft = null
  }
  function stopRest(): void {
    if (active.value) active.value.rest = idle()
  }

  function goTo(step: number): void {
    if (!active.value) return
    const max = active.value.items.length + 1
    active.value.step = Math.min(max, Math.max(0, step))
  }

  const doneSets = computed(() =>
    active.value?.items.reduce((n, it) => n + it.exercises.reduce((m, e) => m + e.sets.filter((s) => s.done).length, 0), 0) ?? 0,
  )
  const totalSets = computed(() =>
    active.value?.items.reduce((n, it) => n + it.exercises.reduce((m, e) => m + e.sets.length, 0), 0) ?? 0,
  )

  function finish(): WorkoutLog | null {
    const a = active.value
    if (!a) return null
    const location = a.location ?? sessionsById[a.sessionId].location
    const log: WorkoutLog = {
      id: uid(), sessionId: a.sessionId, date: a.date, startedAt: a.startedAt, finishedAt: Date.now(),
      programWeek: a.programWeek, location, notes: a.notes.trim(),
      exercises: a.items.flatMap((it) =>
        it.exercises.map((e) => {
          const home = exercisesById[e.exerciseId]?.location === 'home'
          return {
            exerciseId: e.exerciseId, itemId: it.itemId, machine: e.machine.trim(), techniqueOk: e.techniqueOk,
            sets: e.sets.map((s) => ({ ...s })),
            ...(e.plannedId ? { plannedId: e.plannedId } : {}),
            ...(home
              ? { equipment: e.equipment ?? undefined, dumbbells: e.dumbbells || undefined, tempo: e.tempo, level: e.level.trim() || undefined }
              : {}),
          }
        }),
      ),
    }
    workouts.addLog(log)
    if (location === 'home') tracking.setHomeDay(a.date, 'faite')
    active.value = null
    return log
  }

  function abandon(): void {
    active.value = null
  }

  return {
    active, session, order, currentItemIdx, doneSets, totalSets, usesKg,
    start, changeMachine, changeVariant, setDumbbells, swapExercise, postpone, updateSet, toggleDone, addSet, removeSet,
    startRest, addRest, pauseRest, resumeRest, stopRest, goTo, finish, abandon,
  }
})
