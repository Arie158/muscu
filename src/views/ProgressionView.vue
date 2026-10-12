<script setup lang="ts">
import { computed } from 'vue'
import { exercisesById } from '@/data/exercises'
import { LOAD_INCREMENTS, progressionText } from '@/data/progression'
import { mainSessions } from '@/data/sessions'
import { formatShort } from '@/lib/dates'
import { suggestNext } from '@/lib/progression'
import { effectiveTarget } from '@/lib/plan'
import { useSettingsStore } from '@/stores/settings'
import { useWorkoutsStore } from '@/stores/workouts'
import PageHeader from '@/components/PageHeader.vue'
import { homeProgressionRules, homeProgressionSteps } from '@/data/home'
import { weekTemplate } from '@/data/week'
import { PROGRAM_WEEKS } from '@/data/plan'
import { balanceAlerts, doneVolume, plannedVolume, recentAverage, volumeRows } from '@/lib/volume'
import InsightAlerts from '@/components/InsightAlerts.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const workouts = useWorkoutsStore()

// Une ligne par exercice des séances principales (sans doublon).
const rows = computed(() => {
  const seen = new Set<string>()
  const out = []
  for (const s of mainSessions) {
    for (const item of s.items) {
      for (const ie of item.exercises) {
        if (seen.has(ie.exerciseId)) continue
        seen.add(ie.exerciseId)
        const exercise = exercisesById[ie.exerciseId]!
        const target = effectiveTarget(ie.target, exercise, settings.week.block)
        const history = workouts.historyFor(ie.exerciseId)
        const stagnating = workouts.isStagnating(ie.exerciseId)
        const last = workouts.lastPerformance(ie.exerciseId)
        const suggestion = suggestNext({ exercise, target, prescribedSets: item.sets, last, stagnating })
        out.push({ session: s.name, exercise, history, suggestion, stagnating, last })
      }
    }
  }
  return out
})
const tracked = computed(() => rows.value.filter((r) => r.history.length))
const stagnating = computed(() => rows.value.filter((r) => r.stagnating))
// Volume par muscle : semaine type (décharge et mode reprise compris), semaine en cours,
// et moyenne des 4 dernières semaines terminées (dès 2 semaines de recul).
const planned = computed(() => plannedVolume(weekTemplate, { deload: settings.week.isDeload, resume: settings.resumeActive }))
const recent = computed(() => {
  const r = recentAverage(workouts.logs, Math.min(settings.week.week, PROGRAM_WEEKS + 1))
  return r.weeks >= 2 ? r : null
})
const volume = computed(() =>
  volumeRows(planned.value, doneVolume(workouts.logs.filter((l) => l.programWeek === settings.week.week)), recent.value?.volume),
)
const balance = computed(() => balanceAlerts(recent.value?.volume ?? planned.value))
const sets = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

const tone: Record<string, string> = { augmenter: 'ok', baisser: 'warn', repetitions: 'accent' }
</script>

<template>
  <div class="stack">
    <PageHeader title="Progression" subtitle="Double progression, RIR et détection de stagnation." />

    <InsightAlerts />

    <section class="card">
      <h2>La double progression</h2>
      <ol>
        <li v-for="t in progressionText.doubleProgression" :key="t">{{ t }}</li>
      </ol>
      <div class="grid-2">
        <div class="callout"><p class="small"><strong>Haut du corps</strong><br />{{ LOAD_INCREMENTS.haut.label }}</p></div>
        <div class="callout"><p class="small"><strong>Bas du corps</strong><br />{{ LOAD_INCREMENTS.bas.label }}</p></div>
      </div>
      <p class="small muted" style="margin-top: 0.75rem">{{ progressionText.calibration }}</p>
    </section>

    <section class="card">
      <h2>RIR (répétitions en réserve)</h2>
      <ul>
        <li v-for="t in progressionText.rir" :key="t">{{ t }}</li>
      </ul>
    </section>

    <section class="card">
      <h2>Stagnation</h2>
      <ul>
        <li v-for="t in progressionText.stagnation" :key="t">{{ t }}</li>
      </ul>
      <div v-if="stagnating.length" class="callout warn">
        <p><strong>En stagnation :</strong> {{ stagnating.map((r) => r.exercise.name).join(', ') }}.</p>
      </div>
      <p v-else class="small muted">Aucune stagnation détectée pour l’instant.</p>
    </section>

    <section class="card">
      <h2>Volume</h2>
      <ul>
        <li v-for="t in progressionText.volume" :key="t">{{ t }}</li>
      </ul>
      <h3 id="volume-muscles">Séries par muscle et par semaine</h3>
      <p class="small muted">
        Une série compte 1 pour un muscle principal, ½ pour un muscle secondaire (cardio et mobilité exclus) :
        les chiffres sont donc plus hauts que les séries directes ci-dessus.
        « Prévu » suit la semaine type<template v-if="settings.week.isDeload"> en décharge</template><template v-if="settings.resumeActive"> en mode reprise</template>, Maison 3 non comprise.
        <template v-if="recent">« Moyenne » porte sur les {{ recent.weeks }} dernières semaines terminées : c’est elle qui est comparée au repère.</template>
      </p>
      <div class="table-wrap">
        <table aria-labelledby="volume-muscles" class="volume">
          <thead>
            <tr>
              <th scope="col">Muscle <span class="small">(repère)</span></th>
              <th scope="col" class="num">Prévu</th>
              <th scope="col" class="num">Cette sem.</th>
              <th v-if="recent" scope="col" class="num">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in volume" :key="r.id">
              <th scope="row">
                {{ r.label }}
                <span v-if="r.range" class="small muted num d-block">
                  {{ r.range[0] }}-{{ r.range[1] }}
                  <span v-if="r.status === 'sous'" class="badge warn">bas</span>
                  <span v-else-if="r.status === 'au-dessus'" class="badge">élevé</span>
                </span>
              </th>
              <td class="num">{{ sets(r.planned) }}</td>
              <td class="num">{{ sets(r.done) }}</td>
              <td v-if="recent" class="num">{{ sets(r.average ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small muted">
        Repères indicatifs. Sous le repère, le muscle risque d’être peu stimulé ; au-dessus, ce n’est pas une erreur,
        mais la récupération devient la limite (surtout en déficit calorique).
      </p>
      <h3>Équilibre</h3>
      <ul v-if="balance.length" class="list-plain balance">
        <li v-for="b in balance" :key="b.id" class="callout small"><AppIcon name="alert" :size="16" /> {{ b.text }}</li>
      </ul>
      <p v-else class="small">
        <span class="badge ok">Équilibré</span>
        Tirage et poussée, avant et arrière des épaules, quadriceps et ischio-jambiers
        <template v-if="recent">: d’après tes séances des dernières semaines.</template><template v-else>: d’après la semaine type (tes séances seront prises en compte après 2 semaines).</template>
      </p>
    </section>

    <section class="card" aria-labelledby="home-prog">
      <h2 id="home-prog">Exercices maison : progression en 4 étapes</h2>
      <ol>
        <li v-for="s in homeProgressionSteps" :key="s.step"><strong>{{ s.title }}</strong> — {{ s.detail }}</li>
      </ol>
      <ul class="small">
        <li v-for="r in homeProgressionRules" :key="r">{{ r }}</li>
      </ul>
      <p class="small muted">Le mode séance propose automatiquement l’étape suivante, variante par variante.</p>
    </section>

    <section>
      <h2>Prochaine séance, exercice par exercice</h2>
      <p v-if="!tracked.length" class="muted">
        Les suggestions se basent sur tes séances enregistrées (et sur les charges de référence au départ).
      </p>
      <ul class="list-plain">
        <li v-for="r in rows" :key="r.exercise.id" class="card">
          <div class="row-between">
            <RouterLink :to="`/exercices/${r.exercise.id}`"><strong>{{ r.exercise.name }}</strong></RouterLink>
            <span class="badge" :class="tone[r.suggestion.action]">{{ r.suggestion.title }}</span>
          </div>
          <p class="small muted">
            {{ r.session }}
            <template v-if="r.last && r.last.source === 'seance'"> · dernière séance le {{ formatShort(r.last.date) }}</template>
          </p>
          <p class="small">{{ r.suggestion.detail }}</p>
        </li>
      </ul>
      <p class="small muted">Les graphiques de charges sont dans <RouterLink to="/suivi">Suivi</RouterLink>.</p>
    </section>
  </div>
</template>

<style scoped>
.list-plain > li + li { margin-top: 0.6rem; }
.table-wrap { overflow-x: auto; }
.volume th[scope='row'] { font-weight: 500; text-align: left; }
.volume .badge { margin-left: 0.25rem; font-size: 0.72rem; padding: 0.05rem 0.4rem; }
.volume .num { text-align: right; }
.d-block { display: block; }
.balance li { display: flex; gap: 0.4rem; align-items: flex-start; }
.card p:last-child { margin-bottom: 0; }
</style>
