<script setup lang="ts">
// Panneau « Ajouter un exercice » du mode séance : recherche dans tout le catalogue
// (nom, autres noms, muscles, matériel), filtre par partie du corps, ajouts récents en tête.
import { computed, nextTick, ref, watch } from 'vue'
import { exercises, exercisesById } from '@/data/exercises'
import type { Exercise } from '@/data/types'
import { BODY_PARTS, exerciseBodyParts } from '@/lib/muscles'
import { searchExercises } from '@/lib/search'
import { useWorkoutsStore } from '@/stores/workouts'
import AppIcon from './AppIcon.vue'
import ExerciseThumb from './ExerciseThumb.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; pick: [id: string] }>()
const workouts = useWorkoutsStore()

const query = ref('')
const part = ref<string | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  async (o) => {
    await nextTick()
    const d = dialog.value
    if (!d) return
    if (o && !d.open) {
      query.value = ''
      part.value = null
      d.showModal()
      input.value?.focus()
    }
    if (!o && d.open) d.close()
  },
  { immediate: true },
)
function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}

const alphabetical = [...exercises].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
const targets = new Map(exercises.map((e) => [e.id, new Set(exerciseBodyParts(e).primary.map((p) => p.label))]))
const parts = BODY_PARTS.filter((label) => exercises.some((e) => targets.get(e.id)!.has(label)))
const subtitle = (e: Exercise) => [exerciseBodyParts(e).primary.map((p) => p.label).join(', '), e.equipment].filter(Boolean).join(' · ')

/** Exercices déjà ajoutés hors programme, du plus récent au plus ancien. */
const recent = computed(() => {
  const ids: string[] = []
  for (const log of [...workouts.sortedLogs].reverse()) {
    for (const e of log.exercises) if (e.extra && !ids.includes(e.exerciseId) && exercisesById[e.exerciseId]) ids.push(e.exerciseId)
    if (ids.length >= 5) break
  }
  return ids.slice(0, 5).map((id) => exercisesById[id]!)
})
const results = computed(() => {
  const list = part.value ? alphabetical.filter((e) => targets.get(e.id)!.has(part.value!)) : alphabetical
  return searchExercises(list, query.value)
})
const showRecent = computed(() => !query.value.trim() && !part.value && recent.value.length > 0)
</script>

<template>
  <dialog ref="dialog" class="sheet picker" aria-labelledby="picker-title" @close="open && emit('close')" @click="onBackdrop">
    <div class="sheet-inner">
      <header class="sheet-head">
        <p class="eyebrow">Exercice non prévu</p>
        <button type="button" class="btn icon ghost" aria-label="Fermer" @click="emit('close')"><AppIcon name="close" /></button>
      </header>
      <h2 id="picker-title" class="title">Ajouter un exercice</h2>
      <p class="small muted intro">Enregistré avec la séance, avec son propre historique de charges.</p>

      <div class="search">
        <AppIcon name="search" :size="18" class="search-icon" />
        <input
          ref="input"
          v-model="query"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          aria-label="Rechercher un exercice"
          placeholder="curl, presse, tapis, fessiers…"
        />
      </div>
      <div class="tabs filters" role="group" aria-label="Filtrer par partie du corps ciblée">
        <button type="button" :aria-pressed="part === null" @click="part = null">Toutes</button>
        <button v-for="p in parts" :key="p" type="button" :aria-pressed="part === p" @click="part = part === p ? null : p">{{ p }}</button>
      </div>

      <section v-if="showRecent">
        <h3>Ajoutés récemment</h3>
        <ul class="list-plain opts">
          <li v-for="e in recent" :key="e.id">
            <button type="button" class="opt" @click="emit('pick', e.id)">
              <ExerciseThumb :exercise="e" size="sm" :animate="false" :interactive="false" />
              <span>{{ e.name }}<span class="small muted d-block">{{ subtitle(e) }}</span></span>
              <AppIcon name="plus" :size="18" />
            </button>
          </li>
        </ul>
      </section>

      <section>
        <h3 class="count" aria-live="polite">{{ results.length }} exercice{{ results.length > 1 ? 's' : '' }}</h3>
        <ul v-if="results.length" class="list-plain opts">
          <li v-for="e in results" :key="e.id">
            <button type="button" class="opt" @click="emit('pick', e.id)">
              <ExerciseThumb :exercise="e" size="sm" :animate="false" :interactive="false" />
              <span>{{ e.name }}<span class="small muted d-block">{{ subtitle(e) }}</span></span>
              <AppIcon name="plus" :size="18" />
            </button>
          </li>
        </ul>
        <p v-else class="small muted">Aucun exercice trouvé. Essaie un autre mot : nom, muscle ou matériel (« poulie », « haltères »…).</p>
      </section>
    </div>
  </dialog>
</template>

<style scoped>
.picker { height: 88dvh; }
.title { font-size: 1.25rem; margin: 0; }
.intro { margin: -0.5rem 0 0; }
h3 { font-size: 0.95rem; margin: 0 0 0.35rem; }
.count { color: var(--muted); font-weight: 600; }
.search { position: relative; }
.search input { width: 100%; padding-left: 2.4rem; }
.search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.filters { margin: 0 -1rem; padding: 0 1rem 0.25rem; }
.filters button[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
.opts { display: flex; flex-direction: column; gap: 0.4rem; }
.opts > li + li { margin-top: 0; }
.opt {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 56px;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.opt:hover { border-color: var(--accent); }
.d-block { display: block; font-weight: 400; }
</style>
