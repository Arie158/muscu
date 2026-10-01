<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { exercisesById } from '@/data/exercises'
import { COOLDOWN_CARDIO, LOWER_MOBILITY, sessionsById, WARMUP } from '@/data/sessions'
import type { SessionId } from '@/data/types'
import { formatTarget } from '@/lib/format'
import type { WorkoutLog } from '@/lib/models'
import { defaultRest, useActiveStore, type ActiveExercise } from '@/stores/active'
import { useSettingsStore } from '@/stores/settings'
import { useWakeLock } from '@/composables/useWakeLock'
import AppIcon from '@/components/AppIcon.vue'
import NumberStepper from '@/components/NumberStepper.vue'
import ChoicePicker from '@/components/ChoicePicker.vue'
import RestTimer from '@/components/RestTimer.vue'
import WorkoutExercise from '@/components/WorkoutExercise.vue'
import SetCountdown from '@/components/SetCountdown.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useActiveStore()
const settings = useSettingsStore()
useWakeLock()

const requested = computed(() => sessionsById[props.id as SessionId])
const a = computed(() => store.active)
const conflict = computed(() => !!a.value && a.value.sessionId !== props.id)
const saved = ref<WorkoutLog | null>(null)

if (!store.active && requested.value) store.start(requested.value.id)

const session = computed(() => store.session)
const step = computed(() => a.value?.step ?? 0)
const itemCount = computed(() => a.value?.items.length ?? 0)
const itemIdx = computed(() => step.value - 1)
const item = computed(() => a.value?.items[itemIdx.value])
const sessionItem = computed(() => session.value?.items[itemIdx.value])
const isSummary = computed(() => step.value === itemCount.value + 1)
const isLower = computed(() => a.value?.sessionId.startsWith('bas'))
const isHomeSession = computed(() => session.value?.location === 'home')
const warmup = computed(() => session.value?.warmup ?? WARMUP)
const heading = ref<HTMLElement | null>(null)

/** Ligne (série / tour) dépliée par l'utilisateur ; null = la ligne en cours. */
const expanded = ref<number | null>(null)

watch(step, async () => {
  expanded.value = null
  window.scrollTo({ top: 0 })
  await nextTick()
  heading.value?.focus()
})

const isLight = (exerciseId: string) => {
  const k = exercisesById[exerciseId]?.kind
  return k === 'mobilite' || k === 'cardio'
}
function loadStep(exerciseId: string): number {
  const e = exercisesById[exerciseId]
  return (e?.region === 'haut' && e.kind === 'isolation') || e?.location === 'home' ? 1 : 2.5
}
const valueLabel = (ex: ActiveExercise) =>
  ex.target.kind === 'duree' ? 'Secondes' : ex.target.kind === 'minutes' ? 'Minutes' : 'Reps'
const valueStep = (ex: ActiveExercise) => (ex.target.kind === 'reps' ? 1 : 5)
const unitSuffix = (ex: ActiveExercise) => (ex.target.kind === 'duree' ? ' s' : ex.target.kind === 'minutes' ? ' min' : '')

const itemDone = (i: number) => a.value?.items[i]?.exercises.every((e) => e.sets.every((s) => s.done)) ?? false
/** Nombre de lignes d'un bloc : certains exercices font moins (ou plus) de séries que le bloc. */
const rows = computed(() => Math.max(1, ...(item.value?.exercises.map((e) => e.sets.length) ?? [1])))
const rowExercises = (k: number) =>
  (item.value?.exercises ?? []).map((ex, j) => ({ ex, j, set: ex.sets[k] })).filter((x) => x.set)
const rowDone = (k: number) => rowExercises(k).every((x) => x.set!.done)
/** Première ligne pas encore terminée. */
const currentRow = computed(() => {
  for (let k = 0; k < rows.value; k++) if (!rowDone(k)) return k
  return -1
})
const isOpen = (k: number) => (expanded.value ?? currentRow.value) === k
const rowLabel = computed(() => (sessionItem.value?.format === 'circuit' ? 'Tour' : 'Série'))
const multi = computed(() => (item.value?.exercises.length ?? 0) > 1)

function rowSummary(k: number): string {
  const list = rowExercises(k)
  if (list.length > 2) return `${list.filter((x) => x.set!.done).length} / ${list.length} exercices`
  return list
    .map(({ ex, set }) => {
      const load = set!.load !== null && store.usesKg(ex) ? `${set!.load} kg × ` : ''
      const rir = set!.done && set!.rir !== null ? ` · RIR ${set!.rir}` : ''
      return `${load}${set!.reps ?? '—'}${unitSuffix(ex)}${rir}`
    })
    .join('  +  ')
}

/** Résumé du volume affiché sous le titre. */
const volume = computed(() => {
  const it = item.value
  const si = sessionItem.value
  if (!it || !si) return ''
  const first = it.exercises[0]!
  if (si.format === 'activite') return formatTarget(first.target)
  if (si.format === 'circuit') return `${rows.value} tour${rows.value > 1 ? 's' : ''} · ${it.exercises.length} exercices`
  const target = it.exercises.map((e) => formatTarget(e.target, e.perSide)).join(' + ')
  return `${rows.value} × ${target}`
})

function toggle(j: number, k: number) {
  store.toggleDone(itemIdx.value, j, k)
  if (rowDone(k)) expanded.value = null
}
function onCountdown(ex: ActiveExercise, j: number, k: number, seconds: number) {
  const set = ex.sets[k]
  if (!set) return
  set.reps = seconds
  if (!set.done) toggle(j, k)
}

function switchSession() {
  if (!requested.value) return
  if (window.confirm(`Abandonner la séance « ${session.value?.name} » en cours (rien ne sera enregistré) et démarrer « ${requested.value.name} » ?`)) {
    store.abandon()
    store.start(requested.value.id)
  }
}
function abandon() {
  if (window.confirm('Abandonner la séance ? Les séries saisies ne seront pas enregistrées.')) {
    store.abandon()
    void router.push('/')
  }
}
function finish() {
  saved.value = store.finish()
}
</script>

<template>
  <div class="workout" :class="{ 'with-bar': !!item && !saved && !conflict }">
    <!-- Séance enregistrée -->
    <section v-if="saved" class="stack">
      <h1 ref="heading" tabindex="-1">Séance enregistrée 💪</h1>
      <p>{{ sessionsById[saved.sessionId].name }} — {{ saved.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) }} séries.</p>
      <p v-if="(saved.location ?? 'gym') === 'gym'" class="muted">
        {{ COOLDOWN_CARDIO }}<template v-if="saved.sessionId.startsWith('bas')"> {{ LOWER_MOBILITY }}</template>
      </p>
      <p v-else class="muted">Séance maison cochée dans ton suivi du jour.</p>
      <RouterLink to="/" class="btn primary lg block">Retour à l’accueil</RouterLink>
    </section>

    <!-- Autre séance en cours -->
    <section v-else-if="conflict" class="stack">
      <h1 ref="heading" tabindex="-1">Une séance est déjà en cours</h1>
      <p>« {{ session?.name }} » n’est pas terminée ({{ store.doneSets }} / {{ store.totalSets }} séries).</p>
      <RouterLink :to="`/seance/${a!.sessionId}/go`" class="btn primary lg block">Reprendre {{ session?.name }}</RouterLink>
      <button type="button" class="btn danger block" @click="switchSession">Abandonner et démarrer {{ requested?.name }}</button>
    </section>

    <template v-else-if="a && session">
      <header class="topbar">
        <RouterLink to="/" class="btn ghost icon" aria-label="Quitter le mode séance (la séance reste en cours)">
          <AppIcon name="close" />
        </RouterLink>
        <div class="title">
          <strong>{{ session.name }}</strong>
          <span class="small muted num">{{ store.doneSets }} / {{ store.totalSets }} séries</span>
        </div>
        <span class="badge num">{{ Math.min(Math.max(step, 0), itemCount) }}/{{ itemCount }}</span>
        <div class="progress" aria-hidden="true">
          <div :style="{ transform: `scaleX(${store.totalSets ? store.doneSets / store.totalSets : 0})` }" />
        </div>
      </header>

      <!-- Échauffement -->
      <section v-if="step === 0" class="stack">
        <h1 ref="heading" tabindex="-1">Échauffement</h1>
        <ul v-if="warmup.length">
          <li v-for="w in warmup" :key="w">{{ w }}</li>
        </ul>
        <p class="intensity">
          <strong>{{ session.fixedRir ?? (settings.week.rir ? `${settings.week.rir.base} sur les bases` : '') }}</strong>
          <template v-if="a.deload"> · semaine de décharge{{ isHomeSession ? (session.id === 'maison-2' ? ' (2 tours)' : '') : ' (séries réduites)' }}</template>
          <template v-if="a.resume"> · mode reprise (−10 %)</template>
        </p>
        <ul v-if="session.notes?.length" class="small muted">
          <li v-for="n in session.notes" :key="n">{{ n }}</li>
        </ul>
        <button type="button" class="btn primary lg block" @click="store.goTo(1)">
          Commencer <AppIcon name="right" />
        </button>
        <details class="plan">
          <summary>Voir les {{ session.items.length }} blocs de la séance</summary>
          <ol class="small">
            <li v-for="(it, i) in session.items" :key="it.id">
              <button type="button" class="link-btn" @click="store.goTo(i + 1)">{{ it.label }}</button>
            </li>
          </ol>
        </details>
      </section>

      <!-- Exercice -->
      <section v-else-if="item && sessionItem" class="stack">
        <header>
          <p class="eyebrow">
            {{ step }} / {{ itemCount }}<template v-if="sessionItem.format !== 'simple'"> · {{ { superset: 'Superset', circuit: 'Circuit', activite: 'Activité' }[sessionItem.format] }}</template>
          </p>
          <h1 ref="heading" tabindex="-1" class="item-title">{{ sessionItem.label }}</h1>
          <p class="muted small num">
            {{ volume }}<template v-if="sessionItem.rest.max > 0"> · repos {{ sessionItem.restLabel }}</template>
          </p>
          <p class="cue small">{{ sessionItem.cue }}</p>
        </header>

        <p v-if="item.exercises.some((e) => e.equipment === 'band')" class="safety small" role="note">
          <AppIcon name="alert" :size="16" /> Élastique : teste l’ancrage et vérifie l’usure avant chaque série.
        </p>

        <div class="exercises">
          <WorkoutExercise
            v-for="(ex, j) in item.exercises"
            :key="ex.exerciseId"
            :ex="ex"
            :item-idx="itemIdx"
            :ex-idx="j"
            :show-name="multi || sessionItem.format !== 'simple'"
          />
        </div>

        <ol class="list-plain sets" :aria-label="`${rowLabel}s`">
          <li v-for="k in rows" :key="k" class="set" :class="{ open: isOpen(k - 1), done: rowDone(k - 1) }">
            <!-- Ligne repliée : résumé d'une ligne -->
            <button
              v-if="!isOpen(k - 1)"
              type="button"
              class="set-summary"
              :aria-label="`${rowLabel} ${k} : ${rowSummary(k - 1)}${rowDone(k - 1) ? ', faite' : ''} — modifier`"
              @click="expanded = k - 1"
            >
              <span class="set-num">{{ rowLabel }} {{ k }}</span>
              <span class="set-values num">{{ rowSummary(k - 1) }}</span>
              <AppIcon v-if="rowDone(k - 1)" name="check" class="set-check" />
            </button>

            <!-- Ligne dépliée : saisie -->
            <div v-else class="set-edit">
              <p class="set-num">{{ rowLabel }} {{ k }} / {{ rows }}</p>
              <div v-for="{ ex, j, set } in rowExercises(k - 1)" :key="ex.exerciseId" class="set-ex" :class="{ done: set!.done }">
                <p v-if="multi" class="sub">
                  {{ exercisesById[ex.exerciseId]?.name }}
                  <span class="muted">· {{ formatTarget(ex.target, ex.perSide) }}</span>
                </p>
                <div class="inputs" :class="{ two: store.usesKg(ex) }">
                  <div v-if="store.usesKg(ex)" class="field">
                    <span class="small muted">{{ exercisesById[ex.exerciseId]?.loadType === 'assistance' ? 'Assistance kg' : 'Kg' }}</span>
                    <NumberStepper v-model="set!.load" :label="`Charge ${rowLabel.toLowerCase()} ${k}`" unit="kg" :step="loadStep(ex.exerciseId)" />
                  </div>
                  <div class="field">
                    <span class="small muted">{{ valueLabel(ex) }}</span>
                    <NumberStepper v-model="set!.reps" :label="`${valueLabel(ex)} ${rowLabel.toLowerCase()} ${k}`" :step="valueStep(ex)" />
                  </div>
                </div>
                <SetCountdown
                  v-if="ex.target.kind === 'duree' && !set!.done"
                  :seconds="set!.reps ?? ex.target.min"
                  :per-side="ex.perSide"
                  :label="exercisesById[ex.exerciseId]?.name ?? ''"
                  @finished="(sec: number) => onCountdown(ex, j, k - 1, sec)"
                />
                <div v-if="!isLight(ex.exerciseId)" class="rir">
                  <span class="small muted">RIR</span>
                  <ChoicePicker v-model="set!.rir" :label="`RIR ${rowLabel.toLowerCase()} ${k}`" :options="[0, 1, 2, 3, 4]" hide-label />
                </div>
                <button
                  v-if="multi"
                  type="button"
                  class="btn block small-btn"
                  :class="{ primary: !set!.done }"
                  :aria-pressed="set!.done"
                  @click="toggle(j, k - 1)"
                >
                  <AppIcon name="check" /> {{ set!.done ? 'Fait — annuler' : 'Fait' }}
                </button>
              </div>
              <button
                v-if="!multi"
                type="button"
                class="btn lg block"
                :class="{ primary: !rowDone(k - 1) }"
                :aria-pressed="rowDone(k - 1)"
                @click="toggle(0, k - 1)"
              >
                <AppIcon name="check" /> {{ rowDone(k - 1) ? 'Faite — annuler' : `Valider la ${rowLabel.toLowerCase()}` }}
              </button>
            </div>
          </li>
        </ol>

        <details v-if="sessionItem.format !== 'activite'" class="options">
          <summary>Options</summary>
          <div class="row">
            <button type="button" class="btn" @click="store.addSet(itemIdx)"><AppIcon name="plus" /> {{ rowLabel }}</button>
            <button type="button" class="btn" :disabled="rows <= 1" @click="store.removeSet(itemIdx)"><AppIcon name="minus" /> {{ rowLabel }}</button>
            <button v-if="sessionItem.rest.max > 0" type="button" class="btn" @click="store.startRest(defaultRest(sessionItem))">
              <AppIcon name="timer" /> Repos
            </button>
          </div>
        </details>
      </section>

      <!-- Bilan -->
      <section v-else-if="isSummary" class="stack">
        <h1 ref="heading" tabindex="-1">Bilan</h1>
        <ul class="list-plain summary">
          <li v-for="(it, i) in a.items" :key="it.itemId">
            <button type="button" class="summary-item" @click="store.goTo(i + 1)">
              <span>{{ session.items[i]?.label }}</span>
              <span class="badge" :class="itemDone(i) ? 'ok' : 'warn'">
                {{ it.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) }} / {{ it.exercises.reduce((n, e) => n + e.sets.length, 0) }}
              </span>
            </button>
          </li>
        </ul>
        <div class="field">
          <label for="notes">Notes <span class="hint">(sensations, douleur, machine…)</span></label>
          <textarea id="notes" v-model="a.notes" />
        </div>
        <p v-if="!isHomeSession" class="small muted">{{ COOLDOWN_CARDIO }}<template v-if="isLower"> {{ LOWER_MOBILITY }}</template></p>
        <button type="button" class="btn primary lg block" :disabled="store.doneSets === 0" @click="finish">
          <AppIcon name="check" /> Enregistrer la séance
        </button>
        <p v-if="store.doneSets === 0" class="small muted">Valide au moins une série pour enregistrer.</p>
        <button type="button" class="btn ghost block danger-text" @click="abandon">Abandonner la séance</button>
      </section>

      <!-- Barre de navigation fixe -->
      <nav v-if="item" class="workout-bar" aria-label="Navigation entre exercices">
        <button type="button" class="btn icon" aria-label="Exercice précédent" @click="store.goTo(step - 1)"><AppIcon name="left" /></button>
        <button type="button" class="btn primary grow" @click="store.goTo(step + 1)">
          {{ step === itemCount ? 'Bilan' : 'Exercice suivant' }} <AppIcon name="right" />
        </button>
      </nav>

      <RestTimer />
    </template>

    <section v-else class="stack">
      <h1>Séance introuvable</h1>
      <RouterLink to="/seances" class="btn">Voir les séances</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.workout.with-bar { --rest-offset: calc(68px + var(--safe-bottom)); }
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: -1rem -1rem 1rem;
  padding: 0.4rem 1rem;
  background: var(--bg);
}
.title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
.progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--border); }
.progress div { height: 100%; background: var(--accent); transform-origin: left; transition: transform 0.3s ease; }
h1:focus { outline: none; }
.item-title { font-size: 1.4rem; margin-bottom: 0.2rem; }
header p { margin: 0; }
.cue { margin-top: 0.35rem !important; color: var(--muted); }
.intensity { margin: 0; }
.safety { display: flex; gap: 0.4rem; align-items: center; color: var(--warn); margin: 0; }
.exercises { display: flex; flex-direction: column; gap: 0.9rem; }
.exercises > * + * { padding-top: 0.9rem; border-top: 1px solid var(--border); }

.sets { display: flex; flex-direction: column; gap: 0.4rem; }
.sets > li + li { margin-top: 0; }
.set { border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); }
.set.open { border-color: var(--accent); }
.set-summary {
  width: 100%;
  min-height: 52px;
  display: grid;
  grid-template-columns: 4.2rem 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  background: none;
  border: 0;
  color: var(--muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.set.done .set-summary { color: var(--text); }
.set-num { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0; }
.set-values { font-weight: 600; }
.set-check { color: var(--ok); }
.set-edit { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
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
.options > summary, .plan > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; color: var(--muted); font-weight: 600; }
.summary { display: flex; flex-direction: column; gap: 0.4rem; }
.summary > li + li { margin-top: 0; }
.summary-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0.5rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.link-btn { background: none; border: 0; color: var(--accent); font: inherit; text-align: left; cursor: pointer; padding: 0.25rem 0; min-height: 36px; }
.danger-text { color: var(--danger); }
.workout-bar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 25;
  display: flex;
  gap: 0.5rem;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem calc(0.5rem + var(--safe-bottom));
  background: var(--bg);
  border-top: 1px solid var(--border);
}
.workout-bar .grow { flex: 1; }
@media (max-width: 360px) {
  .inputs.two { grid-template-columns: 1fr; }
}
</style>
