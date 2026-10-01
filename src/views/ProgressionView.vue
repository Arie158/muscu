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
import { homeProgressionRules, homeProgressionSteps, homeVolume } from '@/data/home'
import InsightAlerts from '@/components/InsightAlerts.vue'

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
      <h3>Ajouté par Maison 2 (par semaine)</h3>
      <table>
        <thead><tr><th scope="col">Groupe</th><th scope="col">Séries</th><th scope="col">Exercice</th></tr></thead>
        <tbody>
          <tr v-for="v in homeVolume" :key="v.group">
            <td>{{ v.group }}</td>
            <td class="num">≈ +{{ v.sets }}</td>
            <td>{{ v.from }}</td>
          </tr>
        </tbody>
      </table>
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
.card p:last-child { margin-bottom: 0; }
</style>
