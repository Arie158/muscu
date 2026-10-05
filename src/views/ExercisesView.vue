<script setup lang="ts">
// Liste des fiches, filtrable par partie du corps ciblée (filtre gardé dans l'URL : ?partie=Dos).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exercises } from '@/data/exercises'
import { gymAlternatives } from '@/data/gymAlternatives'
import type { Exercise } from '@/data/types'
import PageHeader from '@/components/PageHeader.vue'
import { exerciseImage } from '@/lib/images'
import { BODY_PARTS, exerciseBodyParts } from '@/lib/muscles'

const route = useRoute()
const router = useRouter()

const altIds = new Set(gymAlternatives.map((e) => e.id))
const gym = exercises.filter((e) => e.location !== 'home' && !altIds.has(e.id))
const groups: { id: string; title: string; list: Exercise[] }[] = [
  { id: 'haut', title: 'Salle · haut du corps', list: gym.filter((e) => e.region === 'haut') },
  { id: 'bas', title: 'Salle · bas du corps', list: gym.filter((e) => e.region === 'bas') },
  { id: 'tronc', title: 'Salle · tronc', list: gym.filter((e) => e.region === 'tronc') },
  { id: 'alternatives', title: 'Salle · alternatives (machine occupée)', list: gymAlternatives },
  { id: 'maison-renfo', title: 'Maison · renforcement', list: exercises.filter((e) => e.location === 'home' && e.variants) },
  {
    id: 'maison-mobilite',
    title: 'Maison · gainage, mobilité, marche',
    list: exercises.filter((e) => e.location === 'home' && !e.variants),
  },
]

const targets = new Map(exercises.map((e) => [e.id, new Set(exerciseBodyParts(e).primary.map((p) => p.label))]))
const partCounts = BODY_PARTS.map((label) => ({ label, count: exercises.filter((e) => targets.get(e.id)!.has(label)).length })).filter(
  (p) => p.count > 0,
)
const part = computed(() => {
  const q = route.query.partie
  return typeof q === 'string' && partCounts.some((p) => p.label === q) ? q : null
})
function select(label: string | null) {
  router.replace({ query: label ? { partie: label } : {} })
}
const shown = computed(() =>
  groups
    .map((g) => ({ ...g, list: part.value ? g.list.filter((e) => targets.get(e.id)!.has(part.value!)) : g.list }))
    .filter((g) => g.list.length),
)
const shownCount = computed(() => shown.value.reduce((n, g) => n + g.list.length, 0))
</script>

<template>
  <div class="stack">
    <PageHeader title="Exercices" :subtitle="`${exercises.length} fiches avec illustrations`" back="/seances" back-label="Séances" />
    <div class="tabs filters" role="group" aria-label="Filtrer par partie du corps ciblée">
      <button type="button" :aria-pressed="part === null" @click="select(null)">Toutes</button>
      <button v-for="p in partCounts" :key="p.label" type="button" :aria-pressed="part === p.label" @click="select(p.label)">
        {{ p.label }} <span class="n num">{{ p.count }}</span>
      </button>
    </div>
    <p v-if="part" class="small muted result" aria-live="polite">
      {{ shownCount }} exercice{{ shownCount > 1 ? 's' : '' }} ciblant {{ part }}
    </p>
    <section v-for="g in shown" :key="g.id" class="stack-sm">
      <h2>{{ g.title }}</h2>
      <ul class="list-plain">
        <li v-for="e in g.list" :key="e.id">
          <RouterLink :to="`/exercices/${e.id}`" class="card card-link ex">
            <img
              v-if="e.illustration.dbId"
              :src="exerciseImage(e.illustration.dbId, 0, 'thumb')"
              alt=""
              width="96"
              height="64"
              loading="lazy"
              decoding="async"
            />
            <span v-else class="noimg" aria-hidden="true" />
            <span>
              <strong>{{ e.name }}</strong>
              <span class="small muted d-block">{{ e.primaryMuscles.join(', ') }}</span>
              <span v-if="e.variants" class="small muted d-block">{{ Object.keys(e.variants).length }} variantes de matériel</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.ex { display: flex; gap: 0.75rem; align-items: center; padding: 0.6rem; }
.ex img, .noimg { width: 96px; height: 64px; object-fit: cover; border-radius: 8px; background: #fff; flex-shrink: 0; }
.noimg { background: var(--surface-2); }
.d-block { display: block; }
.filters { margin: 0 -1rem; padding: 0 1rem 0.25rem; }
.filters button[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.n { font-weight: 500; opacity: 0.7; margin-left: 0.15rem; }
.result { margin: 0; }
</style>
