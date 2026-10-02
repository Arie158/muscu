<script setup lang="ts">
// Suivi allégé : le chiffre clé (moyenne 7 jours) et la progression vers l'objectif en tête,
// puis 4 onglets. Les saisies rares (mensurations, photos) et les explications sont repliées.
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { exercises, exercisesById } from '@/data/exercises'
import { sessionsById } from '@/data/sessions'
import { measurementFields, trackingProtocol, TRACKING_INTERVALS_DAYS } from '@/data/tracking'
import { addDays, diffDays, formatShort } from '@/lib/dates'
import type { MeasurementEntry } from '@/lib/models'
import { workingLoad } from '@/lib/progression'
import { rollingAverage, rollingSeries, round1 } from '@/lib/weight'
import { dayPlan, weeklyRegularity } from '@/lib/week'
import { useSettingsStore } from '@/stores/settings'
import { useTrackingStore } from '@/stores/tracking'
import { useWorkoutsStore } from '@/stores/workouts'
import { useInsights } from '@/composables/useInsights'
import ChoicePicker from '@/components/ChoicePicker.vue'
import InsightAlerts from '@/components/InsightAlerts.vue'
import AppIcon from '@/components/AppIcon.vue'

const LineChart = defineAsyncComponent(() => import('@/components/LineChart.vue'))
const PhotosPanel = defineAsyncComponent(() => import('@/components/PhotosPanel.vue'))

const settings = useSettingsStore()
const tracking = useTrackingStore()
const workouts = useWorkoutsStore()
const { avg7 } = useInsights()
const today = computed(() => settings.today)
const fmt = (n: number) => round1(n).toLocaleString('fr-FR')

// ── Chiffre clé et progression vers l'objectif ──
const prevAvg = computed(() => rollingAverage(tracking.weights, addDays(today.value, -7)))
const weekDelta = computed(() => (avg7.value !== null && prevAvg.value !== null ? avg7.value - prevAvg.value : null))
const lost = computed(() => (avg7.value !== null ? settings.settings.startWeight - avg7.value : null))
const toLose = computed(() => settings.settings.startWeight - settings.settings.goalWeight)
const progress = computed(() => (lost.value !== null && toLose.value > 0 ? Math.min(1, Math.max(0, lost.value / toLose.value)) : 0))

// ── Onglets ──
const tabs = [
  { id: 'jour', label: 'Jour' },
  { id: 'mesures', label: 'Mesures' },
  { id: 'courbes', label: 'Courbes' },
  { id: 'carnet', label: 'Carnet' },
] as const
type TabId = (typeof tabs)[number]['id']
const tab = ref<TabId>('jour')
function onTabKey(e: KeyboardEvent, i: number) {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  const next = tabs[(i + dir + tabs.length) % tabs.length]!
  tab.value = next.id
  document.getElementById(`tab-${next.id}`)?.focus()
}

// ── Saisie du jour ──
const day = ref(today.value)
const changingDay = ref(false)
const daily = reactive<{ weight: number | null; steps: number | null; sleep: number | null; energy: number | null; home: 'faite' | 'repos' | null }>({
  weight: null, steps: null, sleep: null, energy: null, home: null,
})
watch(
  day,
  (d) => {
    const e = tracking.data.dailies[d] ?? {}
    Object.assign(daily, { weight: e.weight ?? null, steps: e.steps ?? null, sleep: e.sleep ?? null, energy: e.energy ?? null, home: e.home ?? null })
  },
  { immediate: true },
)
const plannedDay = computed(() => dayPlan(day.value))
const showHomeDay = computed(() => plannedDay.value.location === 'home' || daily.home !== null)
const dailySaved = ref(false)
function saveDaily() {
  tracking.setDaily(day.value, {
    weight: daily.weight ?? undefined, steps: daily.steps ?? undefined,
    sleep: daily.sleep ?? undefined, energy: daily.energy ?? undefined, home: daily.home ?? undefined,
  })
  dailySaved.value = true
  window.setTimeout(() => (dailySaved.value = false), 2000)
}

// ── Rappels : seulement ce qui est à faire ──
const lastDate = (list: { date: string }[]) => list[list.length - 1]?.date ?? null
const due = (last: string | null, every: number) => !last || diffDays(last, today.value) >= every
const waistDue = computed(() => due(lastDate(tracking.waists), TRACKING_INTERVALS_DAYS.waist))
const measurementsDue = computed(() => due(lastDate(tracking.measurements), TRACKING_INTERVALS_DAYS.measurements))
const dueList = computed(() => [waistDue.value && 'tour de taille', measurementsDue.value && 'mensurations'].filter(Boolean) as string[])

// ── Tour de taille & mensurations ──
const waistCm = ref<number | null>(null)
const waistDate = ref(today.value)
function saveWaist() {
  if (!waistCm.value) return
  tracking.setWaist({ date: waistDate.value, cm: waistCm.value })
  waistCm.value = null
}
const mDate = ref(today.value)
const m = reactive<Record<string, number | null>>({ chest: null, arm: null, thigh: null, hips: null })
function saveMeasurements() {
  const entry: MeasurementEntry = { date: mDate.value }
  for (const f of measurementFields) {
    const v = m[f.key]
    if (typeof v === 'number' && v > 0) entry[f.key] = v
  }
  if (Object.keys(entry).length > 1) {
    tracking.setMeasurement(entry)
    for (const f of measurementFields) m[f.key] = null
  }
}
const photosOpen = ref(false)

// ── Courbes : le poids, puis une seule courbe secondaire à la fois ──
const weightSeries = computed(() => [
  { label: 'Moyenne 7 jours', points: rollingSeries(tracking.weights).map((p) => ({ date: p.date, value: round1(p.value) })) },
  { label: 'Pesée du jour', style: 'dots' as const, points: tracking.weights.map((w) => ({ date: w.date, value: w.weight })) },
])
const charts = [
  { id: 'taille', label: 'Taille' },
  { id: 'charges', label: 'Charges' },
  { id: 'regularite', label: 'Régularité' },
  { id: 'forme', label: 'Forme' },
] as const
const chart = ref<(typeof charts)[number]['id']>('taille')
const waistSeries = computed(() => [{ label: 'Tour de taille', points: tracking.waists.map((w) => ({ date: w.date, value: w.cm })) }])
const trackedExercises = computed(() =>
  exercises.filter((e) => e.location !== 'home' && e.loadType !== 'duree' && e.loadType !== 'poids-du-corps' && workouts.historyFor(e.id).length),
)
const chartExercise = ref('')
watch(trackedExercises, (list) => {
  if (!list.some((e) => e.id === chartExercise.value)) chartExercise.value = list[0]?.id ?? ''
}, { immediate: true })
const loadSeries = computed(() => {
  const ex = exercisesById[chartExercise.value]
  if (!ex) return []
  return [{
    label: ex.loadType === 'assistance' ? 'Assistance' : 'Charge de travail',
    points: workouts.historyFor(ex.id).flatMap((h) => {
      const l = workingLoad(h.sets, ex.loadType)
      return l === null ? [] : [{ date: h.date, value: l }]
    }),
  }]
})
const regularity = computed(() => weeklyRegularity(workouts.logs, tracking.data.dailies, today.value, 8))
const regularitySeries = computed(() => [
  { label: 'Salle', points: regularity.value.map((w) => ({ date: w.monday, value: w.gym })) },
  { label: 'Maison', points: regularity.value.map((w) => ({ date: w.monday, value: w.home })) },
])
const scorePoints = (key: 'sleep' | 'energy') =>
  Object.entries(tracking.data.dailies)
    .filter(([, d]) => d[key])
    .map(([date, d]) => ({ date, value: d[key]! }))
    .sort((a, b) => a.date.localeCompare(b.date))
const wellbeing = computed(() => [
  { label: 'Sommeil', points: scorePoints('sleep') },
  { label: 'Énergie', points: scorePoints('energy') },
])

// ── Carnet ──
const recentLogs = computed(() => [...workouts.sortedLogs].reverse().slice(0, 30))
function removeLog(id: string) {
  if (window.confirm('Supprimer cette séance du carnet ?')) workouts.removeLog(id)
}
const setsText = (sets: { load: number | null; reps: number | null; rir: number | null; done: boolean }[]) =>
  sets.filter((s) => s.done).map((s) => `${s.load !== null ? `${s.load}×` : ''}${s.reps}`).join(' · ')
</script>

<template>
  <div class="tracking">
    <h1>Suivi</h1>

    <!-- Chiffre clé -->
    <section class="key" aria-labelledby="key-label">
      <p id="key-label" class="label">Moyenne 7 jours</p>
      <p class="value num">{{ avg7 === null ? '—' : fmt(avg7) }}<span class="unit"> kg</span></p>
      <p v-if="weekDelta !== null" class="delta small">
        {{ weekDelta <= 0 ? '−' : '+' }}{{ fmt(Math.abs(weekDelta)) }} kg cette semaine
      </p>
      <div class="goal">
        <div class="bar" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Progression vers ${settings.settings.goalWeight} kg`">
          <div :style="{ transform: `scaleX(${progress})` }" />
        </div>
        <p class="small muted">
          {{ settings.settings.startWeight }} kg → {{ settings.settings.goalWeight }} kg
          <template v-if="lost !== null && lost > 0"> · {{ fmt(lost) }} kg perdus</template>
        </p>
      </div>
    </section>

    <InsightAlerts />

    <div class="tabs" role="tablist" aria-label="Sections du suivi">
      <button
        v-for="(t, i) in tabs"
        :id="`tab-${t.id}`"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="tab === t.id"
        :aria-controls="`panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
        @keydown="onTabKey($event, i)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Aujourd'hui -->
    <section v-if="tab === 'jour'" id="panel-jour" role="tabpanel" aria-labelledby="tab-jour" class="panel">
      <form class="stack-sm" @submit.prevent="saveDaily">
        <p class="day-line small">
          <template v-if="!changingDay">
            {{ day === today ? 'Aujourd’hui' : formatShort(day) }} ·
            <button type="button" class="link" @click="changingDay = true">autre jour</button>
          </template>
          <label v-else class="day-pick">
            <span class="sr-only">Date</span>
            <input v-model="day" type="date" :max="today" />
          </label>
        </p>
        <div class="grid-2">
          <div class="field">
            <label for="weight">Poids <span class="hint">kg, à jeun</span></label>
            <input id="weight" v-model.number="daily.weight" type="number" inputmode="decimal" step="0.1" min="30" max="300" />
          </div>
          <div class="field">
            <label for="steps">Pas</label>
            <input id="steps" v-model.number="daily.steps" type="number" inputmode="numeric" step="100" min="0" />
          </div>
        </div>
        <ChoicePicker v-model="daily.sleep" label="Sommeil (1 à 5)" :options="[1, 2, 3, 4, 5]" />
        <ChoicePicker v-model="daily.energy" label="Énergie (1 à 5)" :options="[1, 2, 3, 4, 5]" />
        <div v-if="showHomeDay" class="field">
          <span id="home-day-label" class="small strong">{{ sessionsById[plannedDay.sessionId].location === 'home' ? sessionsById[plannedDay.sessionId].name : 'Séance maison' }}</span>
          <div class="segmented" role="group" aria-labelledby="home-day-label">
            <button type="button" :aria-pressed="daily.home === null" @click="daily.home = null">—</button>
            <button type="button" :aria-pressed="daily.home === 'faite'" @click="daily.home = 'faite'">Faite</button>
            <button type="button" :aria-pressed="daily.home === 'repos'" @click="daily.home = 'repos'">Repos complet</button>
          </div>
        </div>
        <button type="submit" class="btn primary block">{{ dailySaved ? 'Enregistré ✓' : 'Enregistrer' }}</button>
      </form>
      <p v-if="dueList.length" class="due small">
        À mesurer : {{ dueList.join(', ') }} ·
        <button type="button" class="link" @click="tab = 'mesures'">y aller</button>
      </p>
    </section>

    <!-- Mesures -->
    <section v-else-if="tab === 'mesures'" id="panel-mesures" role="tabpanel" aria-labelledby="tab-mesures" class="panel stack">
      <form @submit.prevent="saveWaist">
        <h2>Tour de taille <span class="hint-title">chaque semaine, au nombril</span></h2>
        <div class="inline">
          <label for="waist" class="sr-only">Tour de taille (cm)</label>
          <input id="waist" v-model.number="waistCm" type="number" inputmode="decimal" step="0.5" placeholder="cm" />
          <button type="submit" class="btn primary">Ajouter</button>
        </div>
        <details class="other-date small">
          <summary>Autre date</summary>
          <input v-model="waistDate" type="date" :max="today" aria-label="Date de la mesure" />
        </details>
        <ul v-if="tracking.waists.length" class="history list-plain small">
          <li v-for="w in [...tracking.waists].reverse().slice(0, 4)" :key="w.date">
            <span>{{ formatShort(w.date) }}</span>
            <strong class="num">{{ w.cm }} cm</strong>
            <button type="button" class="btn icon ghost" :aria-label="`Supprimer la mesure du ${formatShort(w.date)}`" @click="tracking.removeWaist(w.date)"><AppIcon name="trash" :size="18" /></button>
          </li>
        </ul>
      </form>

      <details class="fold" :open="measurementsDue">
        <summary>Mensurations <span class="hint-title">toutes les 2 semaines</span></summary>
        <form class="stack-sm fold-body" @submit.prevent="saveMeasurements">
          <div class="grid-2">
            <div v-for="f in measurementFields" :key="f.key" class="field">
              <label :for="`m-${f.key}`">{{ f.label }} <span class="hint">cm</span></label>
              <input :id="`m-${f.key}`" v-model.number="m[f.key]" type="number" inputmode="decimal" step="0.5" />
            </div>
          </div>
          <div class="field">
            <label for="m-date">Date</label>
            <input id="m-date" v-model="mDate" type="date" :max="today" />
          </div>
          <button type="submit" class="btn primary">Enregistrer</button>
          <div v-if="tracking.measurements.length" class="table-wrap">
            <table class="small">
              <thead>
                <tr><th scope="col">Date</th><th v-for="f in measurementFields" :key="f.key" scope="col">{{ f.label }}</th><th><span class="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                <tr v-for="r in [...tracking.measurements].reverse()" :key="r.date">
                  <td>{{ formatShort(r.date) }}</td>
                  <td v-for="f in measurementFields" :key="f.key" class="num">{{ r[f.key] ?? '—' }}</td>
                  <td><button type="button" class="btn icon ghost" :aria-label="`Supprimer les mensurations du ${formatShort(r.date)}`" @click="tracking.removeMeasurement(r.date)"><AppIcon name="trash" :size="18" /></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </form>
      </details>

      <details class="fold" @toggle="photosOpen = ($event.target as HTMLDetailsElement).open">
        <summary>Photos <span class="hint-title">toutes les 4 semaines</span></summary>
        <div class="fold-body"><PhotosPanel v-if="photosOpen" /></div>
      </details>

      <details class="fold">
        <summary>Comment se mesurer</summary>
        <ul class="small fold-body">
          <li v-for="p in trackingProtocol" :key="p.what"><strong>{{ p.what }}</strong> — {{ p.when }}. {{ p.note }}</li>
        </ul>
      </details>
    </section>

    <!-- Courbes -->
    <section v-else-if="tab === 'courbes'" id="panel-courbes" role="tabpanel" aria-labelledby="tab-courbes" class="panel stack">
      <LineChart title="Poids (kg)" :series="weightSeries" unit="kg" />
      <div class="segmented chart-pick" role="group" aria-label="Courbe à afficher">
        <button v-for="c in charts" :key="c.id" type="button" :aria-pressed="chart === c.id" @click="chart = c.id">{{ c.label }}</button>
      </div>
      <LineChart v-if="chart === 'taille'" title="Tour de taille (cm)" :series="waistSeries" unit="cm" />
      <template v-else-if="chart === 'charges'">
        <div class="field">
          <label for="chart-ex" class="sr-only">Exercice</label>
          <select id="chart-ex" v-model="chartExercise" :disabled="!trackedExercises.length">
            <option v-if="!trackedExercises.length" value="">Aucune séance salle enregistrée</option>
            <option v-for="e in trackedExercises" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <LineChart :title="`${exercisesById[chartExercise]?.name ?? 'Exercice'} (kg)`" :series="loadSeries" unit="kg" />
      </template>
      <template v-else-if="chart === 'regularite'">
        <LineChart title="Séances par semaine" :series="regularitySeries" unit="séances" :decimals="0" />
        <p class="small muted">Objectif : 4 salle, jusqu’à 3 maison. Un repos complet choisi ne compte pas comme manqué.</p>
      </template>
      <LineChart v-else title="Sommeil et énergie (1-5)" :series="wellbeing" unit="/ 5" :decimals="0" />
    </section>

    <!-- Carnet -->
    <section v-else id="panel-carnet" role="tabpanel" aria-labelledby="tab-carnet" class="panel">
      <p v-if="!recentLogs.length" class="muted">Aucune séance enregistrée pour l’instant.</p>
      <ul class="list-plain log-list">
        <li v-for="l in recentLogs" :key="l.id">
          <details>
            <summary>
              <span><strong>{{ sessionsById[l.sessionId].name }}</strong></span>
              <span class="small muted">{{ formatShort(l.date) }} · S{{ l.programWeek }}</span>
            </summary>
            <ul class="small log">
              <li v-for="e in l.exercises.filter((x) => x.sets.some((s) => s.done))" :key="e.itemId + e.exerciseId">
                {{ exercisesById[e.exerciseId]?.name }}<span v-if="e.plannedId" class="muted"> (au lieu de {{ exercisesById[e.plannedId]?.name }})</span><span v-else-if="e.machine || e.level" class="muted"> ({{ e.machine || e.level }})</span> :
                <span class="num">{{ setsText(e.sets) }}</span>
              </li>
            </ul>
            <p v-if="l.notes" class="small"><em>{{ l.notes }}</em></p>
            <button type="button" class="btn ghost danger-text" @click="removeLog(l.id)"><AppIcon name="trash" :size="18" /> Supprimer</button>
          </details>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.tracking { display: flex; flex-direction: column; gap: 1.25rem; }
h1 { margin: 0; }
.key .label { margin: 0; color: var(--muted); font-weight: 600; font-size: 0.9rem; }
.key .value { font-size: 3.4rem; font-weight: 800; line-height: 1.05; margin: 0.1rem 0 0.2rem; letter-spacing: -0.02em; }
.key .unit { font-size: 1.2rem; color: var(--muted); font-weight: 600; }
.key .delta { margin: 0 0 0.75rem; font-weight: 600; }
.goal .bar { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.goal .bar div { height: 100%; background: var(--accent); transform-origin: left; border-radius: 999px; }
.goal p { margin: 0.35rem 0 0; }

.tracking .tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); overflow: visible; padding-bottom: 0; }
.tracking .tabs button { padding: 0 0.25rem; }
.panel { padding-top: 0.25rem; }
.day-line { margin: 0; color: var(--muted); }
.day-pick input { max-width: 12rem; }
.link { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; min-height: 36px; }
.strong { font-weight: 600; }
.segmented button { flex: 1 1 0; }
.due { margin: 1rem 0 0; color: var(--warn); }

h2 { font-size: 1.05rem; margin-bottom: 0.5rem; }
.hint-title { font-weight: 400; font-size: 0.85rem; color: var(--muted); margin-left: 0.25rem; }
.inline { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.other-date summary { cursor: pointer; color: var(--muted); min-height: 36px; display: flex; align-items: center; }
.history li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.5rem; }
.history li + li { margin-top: 0; border-top: 1px solid var(--border); }
.fold { border-top: 1px solid var(--border); padding-top: 0.25rem; }
.fold > summary { cursor: pointer; min-height: 48px; display: flex; align-items: center; font-weight: 700; }
.fold-body { padding-bottom: 0.5rem; }
.chart-pick button { font-size: 0.85rem; padding: 0 0.3rem; }

.log-list > li + li { margin-top: 0; border-top: 1px solid var(--border); }
.log-list summary { cursor: pointer; min-height: 52px; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.log { margin-top: 0.25rem; }
.danger-text { color: var(--danger); }
</style>
