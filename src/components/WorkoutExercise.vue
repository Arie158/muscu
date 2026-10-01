<script setup lang="ts">
// En-tête d'un exercice dans le mode séance, volontairement sobre :
// visible = dernière perf + suggestion en une ligne (+ variante et niveau de charge à la maison) ;
// replié = illustration, consignes, réglages (machine, tempo, vrais haltères), détail de la suggestion.
import { computed } from 'vue'
import { exercisesById } from '@/data/exercises'
import { equipmentLabels, EQUIPMENT_PREFERENCE, TEMPO_STEPS } from '@/data/home'
import type { HomeEquipment } from '@/data/types'
import { formatShort } from '@/lib/dates'
import { targetUnit } from '@/lib/format'
import { variantOf } from '@/lib/home'
import type { PerformanceEntry } from '@/lib/models'
import { useActiveStore, type ActiveExercise } from '@/stores/active'
import { useWorkoutsStore } from '@/stores/workouts'
import ExerciseIllustration from './ExerciseIllustration.vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(defineProps<{ ex: ActiveExercise; itemIdx: number; exIdx: number; showName?: boolean }>(), {
  showName: true,
})
const store = useActiveStore()
const workouts = useWorkoutsStore()

const exercise = computed(() => exercisesById[props.ex.exerciseId]!)
const isHome = computed(() => exercise.value.location === 'home')
const light = computed(() => exercise.value.kind === 'mobilite' || exercise.value.kind === 'cardio')
const variant = computed(() => variantOf(exercise.value, props.ex.equipment))
const variantKeys = computed(() => EQUIPMENT_PREFERENCE.filter((k) => exercise.value.variants?.[k]))
const unit = computed(() => targetUnit(props.ex.target))
const listId = computed(() => `machines-${props.itemIdx}-${props.exIdx}`)
const machines = computed(() => workouts.machinesFor(props.ex.exerciseId))
const showMachine = computed(() => !isHome.value && store.usesKg(props.ex))
const showLevel = computed(() => isHome.value && variant.value?.load === 'niveau' && !props.ex.dumbbells)

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
    return `Référence : ${l.sets[0]?.load} kg${exercise.value.loadType === 'assistance' ? ' d’assistance' : ''}${l.machine ? ` (${l.machine})` : ''}`
  }
  const sets = l.sets.filter((s) => s.done)
  const loads = [...new Set(sets.map((s) => s.load))]
  const reps = sets.map((s) => s.reps ?? '?').join('·')
  const u = unit.value === 'reps' ? '' : ` ${unit.value}`
  const body = loads.length === 1 && loads[0] !== null ? `${loads[0]} kg × ${reps}${u}` : `${reps}${u}`
  return `${formatShort(l.date)} : ${body}${l.level ? ` · ${l.level}` : ''}`
})

/** Suggestion en une ligne : titre + charge proposée. */
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
    <div v-if="showName" class="row-between name-row">
      <h2 class="name">{{ exercise.name }}</h2>
    </div>

    <template v-if="!light">
      <p class="last small"><span class="muted">Dernière fois</span> {{ lastSummary ?? '— première fois' }}</p>
      <p class="suggestion small" :class="tone"><AppIcon :name="icon" :size="16" /> {{ headline }}</p>
    </template>

    <!-- Maison : variante de matériel et niveau de charge, visibles car utiles à chaque série -->
    <div v-if="variantKeys.length" class="segmented variant" role="group" :aria-label="`Variante de matériel — ${exercise.name}`">
      <button v-for="k in variantKeys" :key="k" type="button" :aria-pressed="ex.equipment === k" @click="onVariant(k)">
        {{ equipmentLabels[k].label }}
      </button>
    </div>
    <div v-if="showLevel" class="level">
      <label :for="`lvl-${itemIdx}-${exIdx}`" class="small">Charge</label>
      <input :id="`lvl-${itemIdx}-${exIdx}`" v-model="ex.level" type="text" maxlength="40" placeholder="ex. 2 bouteilles, élastique rouge" />
    </div>

    <details class="more">
      <summary>Consignes et réglages</summary>
      <div class="stack-sm more-body">
        <ExerciseIllustration :exercise="exercise" :illustration="variant?.illustration" :video-query="variant?.videoQuery" compact />
        <p v-if="variant" class="small"><strong>{{ variant.label }}</strong></p>
        <ul v-if="variant" class="small">
          <li v-for="i in variant.instructions" :key="i">{{ i }}</li>
        </ul>
        <ul v-else class="small">
          <li v-for="t in exercise.technique.slice(0, 3)" :key="t">{{ t }}</li>
        </ul>
        <p v-if="!light" class="small">{{ ex.suggestion.detail }}</p>
        <p v-if="exercise.noFailure" class="small warn-text"><AppIcon name="alert" :size="16" /> Jamais d’échec total sur ce mouvement.</p>

        <div v-if="showMachine" class="field">
          <label :for="`m-${itemIdx}-${exIdx}`">Machine <span class="hint">(pour distinguer deux appareils)</span></label>
          <input :id="`m-${itemIdx}-${exIdx}`" type="text" :value="ex.machine" :list="listId" placeholder="ex. Leg press (machine 1)" @change="onMachine" />
          <datalist :id="listId">
            <option v-for="m in machines" :key="m" :value="m" />
          </datalist>
        </div>
        <div v-if="isHome && !light && !ex.dumbbells" class="field">
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
        <label v-if="!light" class="check small">
          <input v-model="ex.techniqueOk" type="checkbox" />
          Technique propre (décoche si elle s’est dégradée : pas d’augmentation proposée)
        </label>
        <p v-if="!light" class="small muted">RIR = répétitions que tu aurais encore pu faire proprement.</p>
        <RouterLink :to="`/exercices/${exercise.id}`" class="small">Fiche complète</RouterLink>
      </div>
    </details>
  </div>
</template>

<style scoped>
.wex { display: flex; flex-direction: column; gap: 0.4rem; }
.name { margin: 0; font-size: 1.05rem; }
.last { margin: 0; }
.suggestion {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-weight: 600;
}
.suggestion.ok { color: var(--ok); }
.suggestion.warn { color: var(--warn); }
.suggestion.neutral { color: var(--text); }
.variant button { flex: 1 1 0; font-size: 0.85rem; padding: 0 0.4rem; min-height: 40px; }
.level { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; align-items: center; }
.level label { font-weight: 600; color: var(--muted); }
.more > summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; color: var(--accent); font-weight: 600; font-size: 0.9rem; }
.more-body { padding-bottom: 0.5rem; }
.more ul { margin-bottom: 0; }
.field .segmented button { flex: 1 1 0; font-size: 0.85rem; padding: 0 0.3rem; }
.warn-text { color: var(--warn); display: flex; gap: 0.35rem; align-items: center; margin: 0; }
.check { display: flex; align-items: center; gap: 0.6rem; min-height: var(--tap); font-weight: 400; }
</style>
