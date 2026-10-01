<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CARDIO_WEEKLY_MINUTES, cardioPhases, cardioPriority, HIIT_FROM_WEEK, STEPS_FLOOR, stepsRule, stepsTips, stepTargets } from '@/data/cardio'
import { addDays, formatShort, mondayOf } from '@/lib/dates'
import { weekStepsAverage } from '@/lib/steps'
import { useSettingsStore } from '@/stores/settings'
import { useTrackingStore } from '@/stores/tracking'
import { useInsights } from '@/composables/useInsights'
import { useWorkoutsStore } from '@/stores/workouts'
import { exercisesById } from '@/data/exercises'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const tracking = useTrackingStore()
const workouts = useWorkoutsStore()
const { stepsWeek, stepTarget } = useInsights()

// Saisie des pas
const stepsDate = ref(settings.today)
const stepsValue = ref<number | null>(null)
watch(stepsDate, (d) => (stepsValue.value = tracking.data.dailies[d]?.steps ?? null), { immediate: true })
const stepsSaved = ref(false)
function saveSteps() {
  tracking.setDaily(stepsDate.value, { steps: stepsValue.value ?? undefined })
  stepsSaved.value = true
  window.setTimeout(() => (stepsSaved.value = false), 2000)
}

const monday = computed(() => mondayOf(settings.today))
const pastWeeks = computed(() =>
  Array.from({ length: 6 }, (_, i) => {
    const m = addDays(monday.value, -7 * i)
    return { monday: m, ...weekStepsAverage(tracking.data.dailies, m) }
  }),
)

// Cardio structuré
const cardioType = ref<'liss' | 'hiit'>('liss')
const cardioMinutes = ref<number | null>(25)
const cardioDate = ref(settings.today)
function addCardio() {
  if (!cardioMinutes.value || cardioMinutes.value <= 0) return
  tracking.addCardio({ date: cardioDate.value, type: cardioType.value, minutes: cardioMinutes.value })
}
const weekCardio = computed(() =>
  tracking.data.cardio
    .filter((c) => c.date >= monday.value && c.date <= addDays(monday.value, 6))
    .sort((a, b) => a.date.localeCompare(b.date)),
)
/** Minutes de cardio doux / marche enregistrées dans les séances maison de la semaine. */
const homeMinutes = computed(() =>
  workouts.logs
    .filter((l) => l.location === 'home' && l.date >= monday.value && l.date <= addDays(monday.value, 6))
    .flatMap((l) => l.exercises)
    .filter((e) => exercisesById[e.exerciseId]?.kind === 'cardio')
    .reduce((n, e) => n + e.sets.filter((s) => s.done).reduce((m, s) => m + (s.reps ?? 0), 0), 0),
)
const weekMinutes = computed(() => weekCardio.value.reduce((n, c) => n + c.minutes, 0) + homeMinutes.value)
const hiitThisWeek = computed(() => weekCardio.value.filter((c) => c.type === 'hiit').length)
const hiitAllowed = computed(() => settings.week.week >= HIIT_FROM_WEEK)
</script>

<template>
  <div class="stack">
    <PageHeader title="Cardio et pas" :subtitle="cardioPriority" />

    <section class="card stack-sm" aria-labelledby="steps-title">
      <h2 id="steps-title">Pas</h2>
      <div class="grid-2">
        <div>
          <p class="eyebrow">Moyenne cette semaine</p>
          <p class="big-number">{{ stepsWeek.avg?.toLocaleString('fr-FR') ?? '—' }}</p>
          <p class="small muted">{{ stepsWeek.days }} jour{{ stepsWeek.days > 1 ? 's' : '' }} saisi{{ stepsWeek.days > 1 ? 's' : '' }}</p>
        </div>
        <div>
          <p class="eyebrow">Objectif</p>
          <p class="big-number">{{ stepTarget?.target?.toLocaleString('fr-FR') ?? '—' }}</p>
          <p class="small muted">{{ stepTarget?.label }}</p>
        </div>
      </div>
      <form class="grid-2 entry" @submit.prevent="saveSteps">
        <div class="field">
          <label for="steps-date">Date</label>
          <input id="steps-date" v-model="stepsDate" type="date" :max="settings.today" />
        </div>
        <div class="field">
          <label for="steps-value">Pas du jour</label>
          <input id="steps-value" v-model.number="stepsValue" type="number" inputmode="numeric" min="0" step="100" />
        </div>
        <button type="submit" class="btn primary">Enregistrer</button>
        <span v-if="stepsSaved" class="badge ok" role="status">Enregistré</span>
      </form>
      <p class="small">{{ stepsRule }}</p>
    </section>

    <section class="card">
      <h2>Moyennes des dernières semaines</h2>
      <table>
        <thead><tr><th scope="col">Semaine du</th><th scope="col">Moyenne</th><th scope="col">Jours</th></tr></thead>
        <tbody>
          <tr v-for="w in pastWeeks" :key="w.monday">
            <td>{{ formatShort(w.monday) }}</td>
            <td class="num">
              {{ w.avg?.toLocaleString('fr-FR') ?? '—' }}
              <span v-if="w.avg !== null && w.avg < STEPS_FLOOR.min" class="badge warn">sous le plancher</span>
            </td>
            <td class="num">{{ w.days }}/7</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>Progression des objectifs de pas</h2>
      <ul>
        <li v-for="t in stepTargets" :key="t.fromWeek">
          <strong>{{ t.toWeek > 100 ? `À partir de S${t.fromWeek}` : t.fromWeek === t.toWeek ? `S${t.fromWeek}` : `S${t.fromWeek}-S${t.toWeek}` }}</strong> : {{ t.label }}
        </li>
      </ul>
      <h3>Astuces</h3>
      <ul>
        <li v-for="t in stepsTips" :key="t">{{ t }}</li>
      </ul>
    </section>

    <section class="card stack-sm" aria-labelledby="cardio-title">
      <h2 id="cardio-title">Cardio de la semaine</h2>
      <p>
        <span class="big-number">{{ weekMinutes }}</span> <span class="muted">/ {{ CARDIO_WEEKLY_MINUTES.min }}-{{ CARDIO_WEEKLY_MINUTES.max }} min visées</span>
        <span v-if="homeMinutes" class="small muted d-block">dont {{ homeMinutes }} min dans les séances maison</span>
      </p>
      <div v-if="hiitThisWeek > 1" class="callout warn"><p>HIIT : 1 fois par semaine maximum.</p></div>
      <form class="stack-sm" @submit.prevent="addCardio">
        <div class="segmented" role="group" aria-label="Type de cardio">
          <button type="button" :aria-pressed="cardioType === 'liss'" @click="cardioType = 'liss'">LISS</button>
          <button type="button" :aria-pressed="cardioType === 'hiit'" @click="cardioType = 'hiit'">HIIT</button>
        </div>
        <p v-if="cardioType === 'hiit' && !hiitAllowed" class="small warn-text">
          Le HIIT est prévu à partir du mois 2 (semaine {{ HIIT_FROM_WEEK }}). Jamais la veille d’une séance Bas.
        </p>
        <div class="grid-2">
          <div class="field">
            <label for="cardio-date">Date</label>
            <input id="cardio-date" v-model="cardioDate" type="date" :max="settings.today" />
          </div>
          <div class="field">
            <label for="cardio-min">Minutes</label>
            <input id="cardio-min" v-model.number="cardioMinutes" type="number" inputmode="numeric" min="1" />
          </div>
        </div>
        <button type="submit" class="btn primary"><AppIcon name="plus" /> Ajouter</button>
      </form>
      <ul v-if="weekCardio.length" class="list-plain">
        <li v-for="c in weekCardio" :key="c.id" class="row-between">
          <span>{{ formatShort(c.date) }} · <strong>{{ c.type.toUpperCase() }}</strong> {{ c.minutes }} min</span>
          <button type="button" class="btn icon ghost" :aria-label="`Supprimer ${c.type} du ${formatShort(c.date)}`" @click="tracking.removeCardio(c.id)">
            <AppIcon name="trash" />
          </button>
        </li>
      </ul>
    </section>

    <section v-for="p in cardioPhases" :key="p.title" class="card">
      <h2>{{ p.title }}</h2>
      <ul>
        <li v-for="i in p.items" :key="i">{{ i }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.entry { align-items: end; }
.big-number { margin: 0; }
.warn-text { color: var(--warn); }
.d-block { display: block; }
</style>
