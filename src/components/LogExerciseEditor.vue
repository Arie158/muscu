<script setup lang="ts">
// Correction après coup depuis le carnet : séries d'un exercice non prévu ajouté à une séance enregistrée
// (sans `entry`), ou modification d'un exercice déjà enregistré (avec `entry`).
// Charge (si l'exercice se fait en kg) et répétitions / secondes / minutes ; le RIR déjà noté est conservé.
import { computed, nextTick, ref, watch } from 'vue'
import { exercisesById } from '@/data/exercises'
import { equipmentLabels, EQUIPMENT_PREFERENCE } from '@/data/home'
import type { HomeEquipment, Target } from '@/data/types'
import { EXTRA_SETS, extraTarget, loggedWithKg } from '@/lib/extra'
import type { ExerciseLog } from '@/lib/models'
import { pickVariant } from '@/lib/home'
import { useSettingsStore } from '@/stores/settings'
import { useWorkoutsStore } from '@/stores/workouts'
import AppIcon from './AppIcon.vue'
import ExerciseThumb from './ExerciseThumb.vue'
import NumberStepper from './NumberStepper.vue'

const props = withDefaults(
  defineProps<{ open: boolean; exerciseId: string | null; sessionLabel: string; entry?: ExerciseLog | null; unit?: Target['kind'] | null }>(),
  { entry: null, unit: null },
)
const emit = defineEmits<{
  close: []
  change: []
  save: [sets: { load: number | null; reps: number | null }[], equipment: HomeEquipment | null]
}>()
const workouts = useWorkoutsStore()
const settings = useSettingsStore()

const exercise = computed(() => (props.exerciseId ? exercisesById[props.exerciseId] : undefined))
const editing = computed(() => !!props.entry)
const kg = computed(() => !!exercise.value && loggedWithKg(exercise.value, !!props.entry?.dumbbells))
const target = computed(() => (exercise.value ? extraTarget(exercise.value) : null))
const unitKind = computed(() => props.unit ?? target.value?.kind ?? 'reps')
const valueLabel = computed(() => (unitKind.value === 'duree' ? 'Secondes' : unitKind.value === 'minutes' ? 'Minutes' : 'Reps'))
const variantKeys = computed(() => EQUIPMENT_PREFERENCE.filter((k) => exercise.value?.variants?.[k]))
const loadStep = computed(() => (exercise.value?.region === 'haut' && exercise.value.kind === 'isolation' ? 1 : 2.5))

const rows = ref<{ load: number | null; reps: number | null }[]>([])
const equipment = ref<HomeEquipment | null>(null)

/** Pré-remplissage : séries déjà enregistrées (modification), sinon dernière charge connue et bas de la fourchette cible. */
function reset() {
  const e = exercise.value
  if (!e || !target.value) return
  if (props.entry) {
    rows.value = props.entry.sets.filter((s) => s.done).map((s) => ({ load: s.load, reps: s.reps }))
    equipment.value = props.entry.equipment ?? null
    return
  }
  const lastLoad = kg.value ? (workouts.lastPerformance(e.id)?.sets.find((s) => s.done && s.load !== null)?.load ?? null) : null
  const count = e.kind === 'cardio' ? 1 : EXTRA_SETS
  rows.value = Array.from({ length: count }, () => ({ load: lastLoad, reps: target.value!.min }))
  equipment.value = e.variants ? pickVariant(e, settings.settings.homeEquipment) : null
}

const dialog = ref<HTMLDialogElement | null>(null)
watch(
  () => [props.open, props.exerciseId, props.entry] as const,
  async ([o]) => {
    if (o) reset()
    await nextTick()
    const d = dialog.value
    if (!d) return
    if (o && !d.open) d.showModal()
    if (!o && d.open) d.close()
  },
  { immediate: true },
)
function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}

/** Comme en séance : la valeur saisie se reporte sur les séries suivantes. */
function setValue(k: number, field: 'load' | 'reps', value: number | null) {
  for (const r of rows.value.slice(k)) r[field] = value
}
function addRow() {
  const last = rows.value[rows.value.length - 1]
  rows.value.push({ load: last?.load ?? null, reps: last?.reps ?? null })
}
function removeRow() {
  if (rows.value.length > 1) rows.value.pop()
}
const canSave = computed(() => rows.value.some((r) => r.reps !== null && r.reps > 0))
</script>

<template>
  <dialog ref="dialog" class="sheet" aria-labelledby="log-extra-title" @close="open && emit('close')" @click="onBackdrop">
    <div v-if="exercise" class="sheet-inner">
      <header class="sheet-head">
        <p class="eyebrow">{{ editing ? 'Modifier' : 'Ajout à' }} {{ sessionLabel }}</p>
        <button type="button" class="btn icon ghost" aria-label="Fermer" @click="emit('close')"><AppIcon name="close" /></button>
      </header>
      <div class="ex">
        <ExerciseThumb :exercise="exercise" size="sm" :animate="false" :interactive="false" />
        <div>
          <h2 id="log-extra-title" class="title">{{ exercise.name }}</h2>
          <button v-if="!editing" type="button" class="link small" @click="emit('change')">Changer d’exercice</button>
        </div>
      </div>

      <div v-if="variantKeys.length" class="segmented" role="group" aria-label="Variante de matériel">
        <button v-for="k in variantKeys" :key="k" type="button" :aria-pressed="equipment === k" @click="equipment = k">
          {{ equipmentLabels[k].label }}
        </button>
      </div>

      <ol class="list-plain rows">
        <li v-for="(r, k) in rows" :key="k" class="row-set">
          <span class="set-num">Série {{ k + 1 }}</span>
          <div class="inputs" :class="{ two: kg }">
            <div v-if="kg" class="field">
              <span class="small muted">{{ exercise.loadType === 'assistance' ? 'Assistance kg' : 'Kg' }}</span>
              <NumberStepper :model-value="r.load" @update:model-value="(v: number | null) => setValue(k, 'load', v)" :label="`Charge série ${k + 1}`" unit="kg" :step="loadStep" />
            </div>
            <div class="field">
              <span class="small muted">{{ valueLabel }}</span>
              <NumberStepper :model-value="r.reps" @update:model-value="(v: number | null) => setValue(k, 'reps', v)" :label="`${valueLabel} série ${k + 1}`" :step="unitKind === 'reps' ? 1 : 5" />
            </div>
          </div>
        </li>
      </ol>
      <div v-if="exercise.kind !== 'cardio' || editing" class="row">
        <button type="button" class="btn" @click="addRow"><AppIcon name="plus" /> Série</button>
        <button type="button" class="btn" :disabled="rows.length < 2" @click="removeRow"><AppIcon name="minus" /> Série</button>
      </div>

      <button type="button" class="btn primary lg block" :disabled="!canSave" @click="emit('save', rows, equipment)">
        <AppIcon name="check" /> {{ editing ? 'Enregistrer les modifications' : 'Ajouter à la séance' }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.title { font-size: 1.15rem; margin: 0; }
.ex { display: flex; gap: 0.75rem; align-items: center; }
.link { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; min-height: 36px; }
.segmented button { flex: 1 1 0; font-size: 0.85rem; padding: 0 0.4rem; min-height: 40px; }
.rows { display: flex; flex-direction: column; gap: 0.4rem; }
.rows > li + li { margin-top: 0; }
.row-set { padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); }
.set-num { font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
.inputs { display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-top: 0.25rem; }
.inputs.two { grid-template-columns: 1fr 1fr; }
</style>
