<script setup lang="ts">
// Étape 0 du mode séance : échauffement, intensité du jour, plan de la séance.
import { computed, ref } from 'vue'
import { WARMUP } from '@/data/sessions'
import type { Session } from '@/data/types'
import { useActiveStore, type ActiveSession } from '@/stores/active'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from '../AppIcon.vue'

const props = defineProps<{ session: Session; active: ActiveSession }>()
const store = useActiveStore()
const settings = useSettingsStore()
const heading = ref<HTMLElement | null>(null)
defineExpose({ heading })

const warmup = computed(() => props.session.warmup ?? WARMUP)
const isHome = computed(() => props.session.location === 'home')
const intensity = computed(() => props.session.fixedRir ?? (settings.week.rir ? `${settings.week.rir.base} sur les bases` : ''))
</script>

<template>
  <section class="stack">
    <h1 ref="heading" tabindex="-1">Échauffement</h1>
    <ul v-if="warmup.length">
      <li v-for="w in warmup" :key="w">{{ w }}</li>
    </ul>
    <p class="intensity">
      <strong>{{ intensity }}</strong>
      <template v-if="active.deload"> · semaine de décharge{{ isHome ? (session.id === 'maison-2' ? ' (2 tours)' : '') : ' (séries réduites)' }}</template>
      <template v-if="active.resume"> · mode reprise (−10 %)</template>
    </p>
    <ul v-if="session.notes?.length" class="small muted">
      <li v-for="n in session.notes" :key="n">{{ n }}</li>
    </ul>
    <button type="button" class="btn primary lg block" @click="store.goTo(1)">Commencer <AppIcon name="right" /></button>
    <details class="plan">
      <summary>Voir les {{ store.order.length }} blocs de la séance</summary>
      <ol class="small">
        <li v-for="(i, pos) in store.order" :key="i">
          <button type="button" class="link-btn" @click="store.goTo(pos + 1)">{{ store.itemDef(i)?.label }}</button>
        </li>
      </ol>
    </details>
  </section>
</template>

<style scoped>
h1:focus { outline: none; }
.intensity { margin: 0; }
.plan > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; color: var(--muted); font-weight: 600; }
.link-btn { background: none; border: 0; color: var(--accent); font: inherit; text-align: left; cursor: pointer; padding: 0.25rem 0; min-height: 36px; }
</style>
