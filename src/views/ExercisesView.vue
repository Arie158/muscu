<script setup lang="ts">
// Liste des fiches, filtrable par partie du corps ciblée et par recherche (gardés dans l'URL : ?partie=Dos&q=rowing).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exercises } from '@/data/exercises'
import { gymAlternatives } from '@/data/gymAlternatives'
import { catalogExercises } from '@/data/catalog'
import type { Exercise } from '@/data/types'
import PageHeader from '@/components/PageHeader.vue'
import { exerciseImage } from '@/lib/images'
import { BODY_PARTS, exerciseBodyParts } from '@/lib/muscles'
import { searchExercises } from '@/lib/search'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()

const otherIds = new Set([...gymAlternatives, ...catalogExercises].map((e) => e.id))
const gym = exercises.filter((e) => e.location !== 'home' && !otherIds.has(e.id))
const catalog = (pred: (e: Exercise) => boolean) => catalogExercises.filter(pred).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
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
  { id: 'autres-haut', title: 'Autres exercices · haut du corps', list: catalog((e) => e.region === 'haut' && e.kind !== 'mobilite') },
  { id: 'autres-bas', title: 'Autres exercices · bas du corps', list: catalog((e) => e.region === 'bas' && e.kind !== 'mobilite') },
  { id: 'autres-tronc', title: 'Autres exercices · abdos et tronc', list: catalog((e) => e.region === 'tronc' && e.kind !== 'mobilite') },
  { id: 'autres-global', title: 'Autres exercices · complets et athlétiques', list: catalog((e) => e.region === 'global' && e.kind !== 'cardio' && e.kind !== 'mobilite') },
  { id: 'autres-cardio', title: 'Autres exercices · cardio', list: catalog((e) => e.kind === 'cardio') },
  { id: 'autres-mobilite', title: 'Autres exercices · mobilité et étirements', list: catalog((e) => e.kind === 'mobilite') },
]

const targets = new Map(exercises.map((e) => [e.id, new Set(exerciseBodyParts(e).primary.map((p) => p.label))]))
const partCounts = BODY_PARTS.map((label) => ({ label, count: exercises.filter((e) => targets.get(e.id)!.has(label)).length })).filter(
  (p) => p.count > 0,
)
const part = computed(() => {
  const q = route.query.partie
  return typeof q === 'string' && partCounts.some((p) => p.label === q) ? q : null
})
const search = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
function setQuery(next: { partie?: string | null; q?: string }) {
  const partie = next.partie === undefined ? part.value : next.partie
  const q = (next.q ?? search.value).trim() ? (next.q ?? search.value) : ''
  router.replace({ query: { ...(partie ? { partie } : {}), ...(q ? { q } : {}) } })
}
function select(label: string | null) {
  setQuery({ partie: label })
}
const shown = computed(() =>
  groups
    .map((g) => {
      const list = part.value ? g.list.filter((e) => targets.get(e.id)!.has(part.value!)) : g.list
      return { ...g, list: searchExercises(list, search.value) }
    })
    .filter((g) => g.list.length),
)
const shownCount = computed(() => shown.value.reduce((n, g) => n + g.list.length, 0))
</script>

<template>
  <div class="stack">
    <PageHeader title="Exercices" :subtitle="`${exercises.length} fiches`" back="/seances" back-label="Séances" />
    <div class="search">
      <AppIcon name="search" :size="18" class="search-icon" />
      <input
        type="search"
        :value="search"
        inputmode="search"
        enterkeyhint="search"
        autocomplete="off"
        aria-label="Rechercher un exercice"
        placeholder="Rechercher : curl, presse, poulie, fessiers…"
        @input="setQuery({ q: ($event.target as HTMLInputElement).value })"
      />
    </div>
    <div class="tabs filters" role="group" aria-label="Filtrer par partie du corps ciblée">
      <button type="button" :aria-pressed="part === null" @click="select(null)">Toutes</button>
      <button v-for="p in partCounts" :key="p.label" type="button" :aria-pressed="part === p.label" @click="select(p.label)">
        {{ p.label }} <span class="n num">{{ p.count }}</span>
      </button>
    </div>
    <p v-if="part || search" class="small muted result" aria-live="polite">
      {{ shownCount }} exercice{{ shownCount > 1 ? 's' : '' }}<template v-if="part"> ciblant {{ part }}</template><template v-if="search"> pour « {{ search }} »</template>
    </p>
    <p v-if="!shownCount" class="muted">Aucun exercice trouvé. Essaie un autre mot : nom, muscle ou matériel.</p>
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
.search { position: relative; }
.search input { width: 100%; padding-left: 2.4rem; }
.search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
</style>
