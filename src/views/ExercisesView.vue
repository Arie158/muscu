<script setup lang="ts">
import { exercises } from '@/data/exercises'
import { gymAlternatives } from '@/data/gymAlternatives'
import type { Exercise } from '@/data/types'
import PageHeader from '@/components/PageHeader.vue'
import { exerciseImage } from '@/lib/images'

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
</script>

<template>
  <div class="stack">
    <PageHeader title="Exercices" :subtitle="`${exercises.length} fiches avec illustrations`" back="/seances" back-label="Séances" />
    <section v-for="g in groups" :key="g.id" class="stack-sm">
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
</style>
