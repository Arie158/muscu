<script setup lang="ts">
// Un exercice dans le mode séance.
// Toujours visible : miniature animée (touche = le geste), nom, dernière perf, suggestion en une ligne,
// bouton « Machine occupée ? ». Maison : variante de matériel + niveau de charge.
// Replié : réglages (machine, tempo, technique propre, vrais haltères) et détail de la suggestion.
import { computed, ref } from 'vue'
import { exercisesById } from '@/data/exercises'
import { equipmentLabels, EQUIPMENT_PREFERENCE, TEMPO_STEPS } from '@/data/home'
import type { HomeEquipment } from '@/data/types'
import { swapOptions } from '@/lib/alternatives'
import { formatShort } from '@/lib/dates'
import { targetUnit } from '@/lib/format'
import { variantOf } from '@/lib/home'
import type { PerformanceEntry } from '@/lib/models'
import { useActiveStore, type ActiveExercise } from '@/stores/active'
import { useWorkoutsStore } from '@/stores/workouts'
import ExerciseThumb from './ExerciseThumb.vue'
import ExerciseSheet from './ExerciseSheet.vue'
import AppIcon from './AppIcon.vue'
import BodyPartTags from './BodyPartTags.vue'

const props = withDefaults(
  defineProps<{ ex: ActiveExercise; itemIdx: number; exIdx: number; showName?: boolean; cue?: string; canPostpone?: boolean }>(),
  { showName: true, cue: undefined, canPostpone: false },
)
const emit = defineEmits<{ notify: [message: string]; postpone: [] }>()
const store = useActiveStore()
const workouts = useWorkoutsStore()

const exercise = computed(() => exercisesById[props.ex.exerciseId]!)
const planned = computed(() => (props.ex.plannedId ? exercisesById[props.ex.plannedId] : null))
const isHome = computed(() => exercise.value.location === 'home')
const light = computed(() => exercise.value.kind === 'mobilite' || exercise.value.kind === 'cardio')
const variant = computed(() => variantOf(exercise.value, props.ex.equipment))
const variantKeys = computed(() => EQUIPMENT_PREFERENCE.filter((k) => exercise.value.variants?.[k]))
const unit = computed(() => targetUnit(props.ex.target))
const listId = computed(() => `machines-${props.itemIdx}-${props.exIdx}`)
const machines = computed(() => workouts.machinesFor(props.ex.exerciseId))
const showMachine = computed(() => !isHome.value && store.usesKg(props.ex))
const showLevel = computed(() => isHome.value && variant.value?.load === 'niveau' && !props.ex.dumbbells)

// ── Machine occupée ──
const options = computed(() => (isHome.value ? [] : swapOptions(props.ex.plannedId ?? props.ex.exerciseId, props.ex.exerciseId)))
const started = computed(() => props.ex.sets.some((s) => s.done))
const showBusy = computed(() => !isHome.value && !light.value && (options.value.length > 0 || props.canPostpone))
const sheet = ref<'geste' | 'occupee' | null>(null)

function swap(id: string) {
  const name = exercisesById[id]?.name ?? ''
  if (store.swapExercise(props.itemIdx, props.exIdx, id)) {
    sheet.value = null
    emit('notify', props.ex.plannedId ? `Remplacé par ${name}` : `Retour à ${name}`)
  }
}
function postpone() {
  sheet.value = null
  emit('postpone')
}

// ── Dernière perf et suggestion ──
const last = computed<PerformanceEntry | null>(() => {
  if (isHome.value) {
    const h = workouts.homeHistoryFor(props.ex.exerciseId, props.ex.equipment, props.ex.dumbbells)
    return h[h.length - 1] ?? null
  }
  return workouts.lastPerformance(props.ex.exerciseId, props.ex.machine || undefined)
})
const lastSummary = computed(() => {
  const l = last.value
  if (!l) return null
  if (l.source === 'reference') {
    return `Référence : ${l.sets[0]?.load} kg${exercise.value.loadType === 'assistance' ? ' d’assistance' : ''}`
  }
  const sets = l.sets.filter((s) => s.done)
  const loads = [...new Set(sets.map((s) => s.load))]
  const reps = sets.map((s) => s.reps ?? '?').join('·')
  const u = unit.value === 'reps' ? '' : ` ${unit.value}`
  const body = loads.length === 1 && loads[0] !== null ? `${loads[0]} kg × ${reps}${u}` : `${reps}${u}`
  return `${formatShort(l.date)} : ${body}${l.level ? ` · ${l.level}` : ''}`
})
const headline = computed(() => {
  const s = props.ex.suggestion
  const load = s.load !== null && store.usesKg(props.ex) ? ` → ${s.load} kg` : ''
  return `${s.title}${load}`
})
const tones: Record<string, string> = { augmenter: 'ok', niveau: 'ok', variante: 'ok', tempo: 'ok', baisser: 'warn' }
const tone = computed(() => tones[props.ex.suggestion.action] ?? 'neutral')
const icon = computed(() => (tone.value === 'ok' ? 'trend' : tone.value === 'warn' ? 'alert' : 'info'))

function onMachine(e: Event) {
  store.changeMachine(props.itemIdx, props.exIdx, (e.target as HTMLInputElement).value)
}
function onVariant(k: HomeEquipment) {
  store.changeVariant(props.itemIdx, props.exIdx, k)
}
</script>

<template>
  <div class="wex">
    <div class="head">
      <ExerciseThumb :exercise="exercise" :illustration="variant?.illustration" @open="sheet = 'geste'" />
      <div class="info">
        <h2 v-if="showName" class="name">{{ exercise.name }}</h2>
        <p v-if="planned" class="swapped small">au lieu de {{ planned.name }}</p>
        <BodyPartTags :exercise="exercise" />
        <template v-if="!light">
          <p class="last small"><span class="muted">Dernière fois</span> {{ lastSummary ?? '— première fois' }}</p>
          <p class="suggestion small" :class="tone"><AppIcon :name="icon" :size="16" /> {{ headline }}</p>
        </template>
        <button v-else type="button" class="link small" @click="sheet = 'geste'">Voir le geste</button>
      </div>
    </div>

    <button v-if="showBusy" type="button" class="busy" @click="sheet = 'occupee'">
      <AppIcon name="dumbbell" :size="18" /> Machine occupée ?
    </button>

    <!-- Maison : variante de matériel et niveau de charge -->
    <div v-if="variantKeys.length" class="segmented variant" role="group" :aria-label="`Variante de matériel — ${exercise.name}`">
      <button v-for="k in variantKeys" :key="k" type="button" :aria-pressed="ex.equipment === k" @click="onVariant(k)">
        {{ equipmentLabels[k].label }}
      </button>
    </div>
    <div v-if="showLevel" class="level">
      <label :for="`lvl-${itemIdx}-${exIdx}`" class="small">Charge</label>
      <input :id="`lvl-${itemIdx}-${exIdx}`" v-model="ex.level" type="text" maxlength="40" placeholder="ex. 2 bouteilles, élastique rouge" />
    </div>

    <details v-if="!light" class="more">
      <summary>Réglages</summary>
      <div class="stack-sm more-body">
        <p class="small">{{ ex.suggestion.detail }}</p>
        <p v-if="exercise.noFailure" class="small warn-text"><AppIcon name="alert" :size="16" /> Jamais d’échec total sur ce mouvement.</p>
        <div v-if="showMachine" class="field">
          <label :for="`m-${itemIdx}-${exIdx}`">Machine <span class="hint">(pour distinguer deux appareils)</span></label>
          <input :id="`m-${itemIdx}-${exIdx}`" type="text" :value="ex.machine" :list="listId" placeholder="ex. Leg press (machine 1)" @change="onMachine" />
          <datalist :id="listId">
            <option v-for="m in machines" :key="m" :value="m" />
          </datalist>
        </div>
        <div v-if="isHome && !ex.dumbbells" class="field">
          <span class="small muted">Tempo</span>
          <div class="segmented" role="group" :aria-label="`Tempo — ${exercise.name}`">
            <button v-for="t in TEMPO_STEPS" :key="t.id" type="button" :aria-pressed="ex.tempo === t.id" @click="ex.tempo = t.id">
              {{ t.label }}
            </button>
          </div>
        </div>
        <label v-if="ex.equipment === 'improvised'" class="check small">
          <input type="checkbox" :checked="ex.dumbbells" @change="store.setDumbbells(itemIdx, exIdx, ($event.target as HTMLInputElement).checked)" />
          J’utilise de vrais haltères (kg)
        </label>
        <label class="check small">
          <input v-model="ex.techniqueOk" type="checkbox" />
          Technique propre (décoche si elle s’est dégradée : pas d’augmentation proposée)
        </label>
        <p class="small muted">RIR = répétitions que tu aurais encore pu faire proprement.</p>
      </div>
    </details>

    <ExerciseSheet
      :open="sheet !== null"
      :mode="sheet ?? 'geste'"
      :exercise="exercise"
      :variant="variant"
      :cue="cue"
      :options="options"
      :can-swap="!started"
      :can-postpone="canPostpone"
      :planned-name="planned?.name"
      @close="sheet = null"
      @swap="swap"
      @postpone="postpone"
    />
  </div>
</template>

<style scoped>
.wex { display: flex; flex-direction: column; gap: 0.5rem; }
.head { display: flex; gap: 0.75rem; align-items: flex-start; }
.info { min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.name { margin: 0; font-size: 1.05rem; }
.swapped { margin: 0; color: var(--home); font-weight: 600; }
.last { margin: 0; }
.suggestion { display: flex; align-items: center; gap: 0.35rem; margin: 0; font-weight: 600; }
.suggestion.ok { color: var(--ok); }
.suggestion.warn { color: var(--warn); }
.suggestion.neutral { color: var(--text); }
.busy {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0 0.85rem;
  border: 1px dashed var(--border);
  border-radius: 999px;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
.busy:hover { color: var(--text); border-color: var(--accent); }
.link { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; min-height: 36px; text-align: left; }
.variant button { flex: 1 1 0; font-size: 0.85rem; padding: 0 0.4rem; min-height: 40px; }
.level { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; align-items: center; }
.level label { font-weight: 600; color: var(--muted); }
.more > summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; color: var(--muted); font-weight: 600; font-size: 0.9rem; }
.more-body { padding-bottom: 0.5rem; }
.field .segmented button { flex: 1 1 0; font-size: 0.85rem; padding: 0 0.3rem; }
.warn-text { color: var(--warn); display: flex; gap: 0.35rem; align-items: center; margin: 0; }
.check { display: flex; align-items: center; gap: 0.6rem; min-height: var(--tap); font-weight: 400; }
</style>
