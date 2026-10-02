<script setup lang="ts">
// Saisie d'une ligne dépliée (série ou tour) : charge, reps/durée, chrono, RIR, validation.
import { computed } from 'vue'
import { exercisesById } from '@/data/exercises'
import { formatTarget } from '@/lib/format'
import { isRowDone, rowEntries } from '@/lib/workoutRows'
import { useActiveStore, type ActiveExercise, type ActiveItem } from '@/stores/active'
import AppIcon from '../AppIcon.vue'
import NumberStepper from '../NumberStepper.vue'
import ChoicePicker from '../ChoicePicker.vue'
import SetCountdown from '../SetCountdown.vue'

const props = defineProps<{ item: ActiveItem; itemIdx: number; k: number; rows: number; rowLabel: string }>()
const emit = defineEmits<{ toggle: [j: number] }>()
const store = useActiveStore()

const entries = computed(() => rowEntries(props.item.exercises, props.k))
const multi = computed(() => props.item.exercises.length > 1)
const done = computed(() => isRowDone(props.item.exercises, props.k))
const label = (what: string) => `${what} ${props.rowLabel.toLowerCase()} ${props.k + 1}`

const isLight = (exerciseId: string) => {
  const kind = exercisesById[exerciseId]?.kind
  return kind === 'mobilite' || kind === 'cardio'
}
function loadStep(exerciseId: string): number {
  const e = exercisesById[exerciseId]
  return (e?.region === 'haut' && e.kind === 'isolation') || e?.location === 'home' ? 1 : 2.5
}
const valueLabel = (ex: ActiveExercise) => (ex.target.kind === 'duree' ? 'Secondes' : ex.target.kind === 'minutes' ? 'Minutes' : 'Reps')
const valueStep = (ex: ActiveExercise) => (ex.target.kind === 'reps' ? 1 : 5)

function setValue(j: number, field: 'load' | 'reps', value: number | null) {
  store.updateSet(props.itemIdx, j, props.k, { [field]: value })
}
function onCountdown(ex: ActiveExercise, j: number, seconds: number) {
  const set = ex.sets[props.k]
  if (!set) return
  set.reps = seconds
  if (!set.done) emit('toggle', j)
}
</script>

<template>
  <div class="set-edit">
    <p class="set-num">{{ rowLabel }} {{ k + 1 }} / {{ rows }}</p>
    <div v-for="{ ex, j, set } in entries" :key="ex.exerciseId" class="set-ex" :class="{ done: set.done }">
      <p v-if="multi" class="sub">
        {{ exercisesById[ex.exerciseId]?.name }}
        <span class="muted">· {{ formatTarget(ex.target, ex.perSide) }}</span>
      </p>
      <div class="inputs" :class="{ two: store.usesKg(ex) }">
        <div v-if="store.usesKg(ex)" class="field">
          <span class="small muted">{{ exercisesById[ex.exerciseId]?.loadType === 'assistance' ? 'Assistance kg' : 'Kg' }}</span>
          <NumberStepper :model-value="set.load" :label="label('Charge')" unit="kg" :step="loadStep(ex.exerciseId)" @update:model-value="(v: number | null) => setValue(j, 'load', v)" />
        </div>
        <div class="field">
          <span class="small muted">{{ valueLabel(ex) }}</span>
          <NumberStepper :model-value="set.reps" :label="label(valueLabel(ex))" :step="valueStep(ex)" @update:model-value="(v: number | null) => setValue(j, 'reps', v)" />
        </div>
      </div>
      <SetCountdown
        v-if="ex.target.kind === 'duree' && !set.done"
        :seconds="set.reps ?? ex.target.min"
        :per-side="ex.perSide"
        :label="exercisesById[ex.exerciseId]?.name ?? ''"
        @finished="(sec: number) => onCountdown(ex, j, sec)"
      />
      <div v-if="!isLight(ex.exerciseId)" class="rir">
        <span class="small muted">RIR</span>
        <ChoicePicker v-model="set.rir" :label="label('RIR')" :options="[0, 1, 2, 3, 4]" hide-label />
      </div>
      <button v-if="multi" type="button" class="btn block small-btn" :class="{ primary: !set.done }" :aria-pressed="set.done" @click="emit('toggle', j)">
        <AppIcon name="check" /> {{ set.done ? 'Fait — annuler' : 'Fait' }}
      </button>
    </div>
    <button v-if="!multi" type="button" class="btn lg block" :class="{ primary: !done }" :aria-pressed="done" @click="emit('toggle', 0)">
      <AppIcon name="check" /> {{ done ? 'Faite — annuler' : `Valider la ${rowLabel.toLowerCase()}` }}
    </button>
  </div>
</template>

<style scoped>
.set-edit { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
.set-num { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0; }
.set-ex { display: flex; flex-direction: column; gap: 0.5rem; }
.set-ex + .set-ex { padding-top: 0.6rem; border-top: 1px dashed var(--border); }
.set-ex.done { opacity: 0.7; }
.sub { font-weight: 700; margin: 0; }
.inputs { display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
.inputs.two { grid-template-columns: 1fr 1fr; }
.rir { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; align-items: center; }
.rir :deep(.segmented) { flex-wrap: nowrap; gap: 0.25rem; }
.rir :deep(.segmented button) { min-width: 0; min-height: 40px; }
.small-btn { min-height: 44px; }
@media (max-width: 360px) {
  .inputs.two { grid-template-columns: 1fr; }
}
</style>
