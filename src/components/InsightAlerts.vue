<script setup lang="ts">
// Alertes douces, en une ligne chacune ; le détail (actions conseillées) se déplie.
import { computed } from 'vue'
import { useInsights } from '@/composables/useInsights'
import { exercisesById } from '@/data/exercises'
import { alertActions } from '@/data/home'
import { round1 } from '@/lib/weight'
import AppIcon from './AppIcon.vue'

const { criteria, matchedCriteria, training, recovery } = useInsights()

const signalLabels = {
  charges: 'charges en baisse sur plusieurs exercices',
  sommeil: 'sommeil ≤ 2/5 plusieurs jours',
  energie: 'énergie ≤ 2/5 plusieurs jours',
  'haut-en-baisse': 'Haut A ou Haut B en baisse',
} as const

const adjust = computed(() => matchedCriteria.value.filter((c) => c.tone === 'ajuster'))
</script>

<template>
  <div v-if="recovery.signals.length || adjust.length || training.alert" class="alerts">
    <details v-if="recovery.signals.length" class="alert">
      <summary><AppIcon name="alert" :size="18" /> <span>Récupération à surveiller</span></summary>
      <div class="small body">
        <p>{{ recovery.signals.map((s) => signalLabels[s]).join(' · ') }}</p>
        <ol>
          <li v-if="recovery.actions.includes('retirer-series-maison-2')">{{ alertActions.upperDrop }}</li>
          <template v-if="recovery.actions.includes('supprimer-maison-3')">
            <li v-for="a in alertActions.general" :key="a">{{ a }}</li>
          </template>
        </ol>
      </div>
    </details>
    <details v-for="c in adjust" :key="c.id" class="alert">
      <summary><AppIcon name="alert" :size="18" /> <span>Ajustement suggéré : {{ c.action }}</span></summary>
      <p class="small body">
        {{ c.situation }} (≈ {{ round1(criteria.lossPerWeek ?? 0) }} kg/semaine sur 2 semaines). À confirmer sur 2-3 semaines.
      </p>
    </details>
    <details v-if="training.alert" class="alert">
      <summary><AppIcon name="alert" :size="18" /> <span>Stagnation : envisage d’avancer la décharge</span></summary>
      <p class="small body">Concernés : {{ training.stagnating.map((id) => exercisesById[id]?.name ?? id).join(', ') }}.</p>
    </details>
  </div>
</template>

<style scoped>
.alerts { display: flex; flex-direction: column; gap: 0.25rem; }
.alert { border-left: 4px solid var(--warn); padding-left: 0.75rem; }
.alert > summary {
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  list-style: none;
}
.alert > summary::-webkit-details-marker { display: none; }
.alert > summary svg { color: var(--warn); flex-shrink: 0; }
.alert > summary::after { content: '›'; margin-left: auto; color: var(--muted); font-size: 1.3rem; transition: transform 0.2s; }
.alert[open] > summary::after { transform: rotate(90deg); }
.body { margin: 0 0 0.5rem; }
.body p { margin: 0 0 0.25rem; }
.body ol { margin: 0; }
</style>
