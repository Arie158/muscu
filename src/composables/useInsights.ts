import { computed } from 'vue'
import { modificationCriteria } from '@/data/tracking'
import { evaluateCriteria, performanceTrend, trainingStagnation } from '@/lib/criteria'
import { mondayOf } from '@/lib/dates'
import { stepTargetForWeek, weekStepsAverage } from '@/lib/steps'
import { rollingAverage } from '@/lib/weight'
import { decliningExercises, recoveryAlert, upperSessionDeclined } from '@/lib/priority'
import { exercisesById } from '@/data/exercises'
import { useSettingsStore } from '@/stores/settings'
import { useTrackingStore } from '@/stores/tracking'
import { useWorkoutsStore } from '@/stores/workouts'

/** Indicateurs dérivés partagés entre l'accueil, le suivi et l'alimentation. */
export function useInsights() {
  const settings = useSettingsStore()
  const tracking = useTrackingStore()
  const workouts = useWorkoutsStore()

  const today = computed(() => settings.today)
  const avg7 = computed(() => rollingAverage(tracking.weights, today.value))
  const perfTrend = computed(() => performanceTrend(workouts.histories, today.value))
  const criteria = computed(() =>
    evaluateCriteria({
      programWeek: settings.week.week,
      today: today.value,
      weights: tracking.weights,
      waists: tracking.waists,
      perfTrend: perfTrend.value,
    }),
  )
  const matchedCriteria = computed(() =>
    modificationCriteria.filter((c) => criteria.value.matched.includes(c.id)),
  )
  const training = computed(() => trainingStagnation(workouts.histories, today.value))
  const stepsWeek = computed(() => weekStepsAverage(tracking.data.dailies, mondayOf(today.value)))
  const stepTarget = computed(() => stepTargetForWeek(Math.max(1, settings.week.week)))

  /** Signaux d'alerte : charges salle en baisse, sommeil ou énergie bas, Haut A / Haut B en baisse. */
  const recovery = computed(() =>
    recoveryAlert({
      today: today.value,
      dailies: tracking.data.dailies,
      decliningCount: decliningExercises(workouts.histories, today.value).length,
      upperDeclined: upperSessionDeclined(
        workouts.sortedLogs,
        workouts.historyFor,
        (id) => (exercisesById[id]?.location === 'home' ? undefined : exercisesById[id]?.loadType),
        today.value,
      ),
    }),
  )

  return { avg7, perfTrend, criteria, matchedCriteria, training, stepsWeek, stepTarget, recovery }
}
