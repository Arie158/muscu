<script setup lang="ts">
import { homeSessionsNote, nutritionDisclaimer, nutritionPrinciples, nutritionTargets, weightTrajectory } from '@/data/nutrition'
import { criteriaConfig, modificationCriteria, trainingCriteria } from '@/data/tracking'
import { useInsights } from '@/composables/useInsights'
import { round1 } from '@/lib/weight'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const { criteria } = useInsights()
const macros = [
  { label: 'Protéines', value: nutritionTargets.protein },
  { label: 'Lipides', value: nutritionTargets.fat },
  { label: 'Glucides', value: nutritionTargets.carbs },
  { label: 'Eau', value: nutritionTargets.water },
]
const trendLabel = { hausse: 'en hausse', baisse: 'en baisse', stable: 'stables' } as const
</script>

<template>
  <div class="stack">
    <PageHeader title="Alimentation" subtitle="Principes et repères indicatifs." />

    <div class="callout warn" role="note">
      <p><AppIcon name="alert" :size="18" /> <strong>Estimations, pas un avis médical.</strong></p>
      <p class="small">{{ nutritionDisclaimer }}</p>
    </div>

    <section class="card">
      <p class="eyebrow">Calories de départ</p>
      <p class="big-number">{{ nutritionTargets.calories.toLocaleString('fr-FR') }} <span class="small muted">kcal / jour</span></p>
      <p class="small muted">{{ nutritionTargets.caloriesSource }}</p>
      <dl class="macros">
        <div v-for="m in macros" :key="m.label">
          <dt>{{ m.label }}</dt>
          <dd>{{ m.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="card">
      <h2>Principes</h2>
      <p class="callout small">{{ homeSessionsNote }}</p>
      <ul>
        <li v-for="p in nutritionPrinciples" :key="p">{{ p }}</li>
      </ul>
      <p class="small">{{ weightTrajectory }}</p>
    </section>

    <section class="card">
      <h2>Ajustements (à partir de la semaine {{ criteriaConfig.fromWeek }})</h2>
      <p class="small muted">À évaluer sur 2 à 3 semaines, jamais sur quelques jours.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Situation</th><th scope="col">Action suggérée</th></tr></thead>
          <tbody>
            <tr v-for="c in modificationCriteria" :key="c.id" :class="{ matched: criteria.matched.includes(c.id) }">
              <td>
                {{ c.situation }}
                <span v-if="criteria.matched.includes(c.id)" class="badge accent">ta situation</span>
              </td>
              <td><strong>{{ c.action }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 style="margin-top: 1rem">Entraînement</h3>
      <ul>
        <li v-for="t in trainingCriteria" :key="t.situation">{{ t.situation }} → <strong>{{ t.action }}</strong></li>
      </ul>
    </section>

    <section class="card">
      <h2>Ta situation actuelle</h2>
      <p v-if="criteria.status === 'trop-tot'" class="muted">L’évaluation commence à la semaine {{ criteriaConfig.fromWeek }}.</p>
      <p v-else-if="criteria.status === 'donnees-insuffisantes'" class="muted">
        Pas assez de pesées : il faut au moins 3 pesées dans la semaine en cours et dans celle d’il y a 2 semaines.
      </p>
      <ul v-else>
        <li>Perte moyenne : <strong>{{ round1(criteria.lossPerWeek ?? 0) }} kg/semaine</strong></li>
        <li>Tour de taille sur 2 semaines : <strong>{{ criteria.waistDelta === null ? 'non mesuré' : `${criteria.waistDelta > 0 ? '+' : ''}${round1(criteria.waistDelta)} cm` }}</strong></li>
        <li>Performances : <strong>{{ criteria.perfTrend ? trendLabel[criteria.perfTrend] : 'pas assez de séances' }}</strong></li>
      </ul>
      <p v-if="criteria.status === 'evalue' && !criteria.matched.length" class="small muted">
        Aucune règle du tableau ne s’applique exactement : continue d’observer.
      </p>
    </section>
  </div>
</template>

<style scoped>
.macros { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1rem 0 0; }
.macros dt { font-size: 0.82rem; color: var(--muted); font-weight: 600; }
.macros dd { margin: 0; font-weight: 700; }
tr.matched td { background: var(--accent-soft); }
.callout p:first-child { display: flex; align-items: center; gap: 0.4rem; }
</style>
