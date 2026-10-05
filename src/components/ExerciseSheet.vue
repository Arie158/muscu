<script setup lang="ts">
// Panneau qui s'ouvre par-dessus la séance (sans la quitter).
// mode « geste »   : grande illustration, consigne clé, 3 points techniques, 2 erreurs, alternatives.
// mode « occupee » : alternatives à prendre tout de suite, ou faire l'exercice plus tard.
import { computed, nextTick, ref, watch } from 'vue'
import type { EquipmentVariant, Exercise } from '@/data/types'
import ExerciseIllustration from './ExerciseIllustration.vue'
import ExerciseThumb from './ExerciseThumb.vue'
import AppIcon from './AppIcon.vue'
import BodyMap from './BodyMap.vue'
import BodyPartTags from './BodyPartTags.vue'
import { exerciseBodyParts } from '@/lib/muscles'

const props = defineProps<{
  open: boolean
  mode: 'geste' | 'occupee'
  exercise: Exercise
  variant?: EquipmentVariant | null
  cue?: string
  options: Exercise[]
  canSwap: boolean
  canPostpone: boolean
  plannedName?: string
}>()
const emit = defineEmits<{ close: []; swap: [id: string]; postpone: [] }>()

const parts = computed(() => exerciseBodyParts(props.exercise))
const dialog = ref<HTMLDialogElement | null>(null)
watch(
  () => props.open,
  async (o) => {
    await nextTick()
    const d = dialog.value
    if (!d) return
    if (o && !d.open) d.showModal()
    if (!o && d.open) d.close()
  },
  { immediate: true },
)
function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="sheet" :aria-label="mode === 'geste' ? `Geste : ${exercise.name}` : 'Machine occupée'" @close="emit('close')" @click="onBackdrop">
    <div class="sheet-inner">
      <header class="sheet-head">
        <p class="eyebrow">{{ mode === 'geste' ? 'Le geste' : 'Machine occupée ?' }}</p>
        <button type="button" class="btn icon ghost" aria-label="Fermer" @click="emit('close')"><AppIcon name="close" /></button>
      </header>

      <!-- Le geste -->
      <template v-if="mode === 'geste'">
        <h2 class="title">{{ exercise.name }}</h2>
        <ExerciseIllustration
          v-if="open"
          :exercise="exercise"
          :illustration="variant?.illustration"
          :video-query="variant?.videoQuery"
        />
        <p v-if="cue" class="cue"><strong>Clé :</strong> {{ cue }}</p>
        <section class="muscles">
          <h3>Muscles travaillés</h3>
          <div class="muscles-body">
            <BodyMap :primary="parts.primary.map((p) => p.label)" :secondary="parts.secondary.map((p) => p.label)" size="sm" />
            <BodyPartTags :exercise="exercise" />
          </div>
        </section>
        <section>
          <h3>Technique</h3>
          <ul>
            <li v-for="t in (variant?.instructions ?? exercise.technique).slice(0, 3)" :key="t">{{ t }}</li>
          </ul>
        </section>
        <section>
          <h3>À éviter</h3>
          <ul>
            <li v-for="m in exercise.mistakes.slice(0, 2)" :key="m">{{ m }}</li>
          </ul>
        </section>
        <section v-if="options.length && canSwap">
          <h3>Machine occupée ?</h3>
          <ul class="list-plain opts">
            <li v-for="o in options" :key="o.id">
              <button type="button" class="opt" @click="emit('swap', o.id)">
                <ExerciseThumb :exercise="o" size="sm" :animate="false" :interactive="false" />
                <span>{{ o.name }}</span>
                <AppIcon name="right" :size="18" />
              </button>
            </li>
          </ul>
        </section>
        <RouterLink :to="`/exercices/${exercise.id}`" class="small">Fiche complète</RouterLink>
      </template>

      <!-- Machine occupée -->
      <template v-else>
        <h2 class="title">Remplacer {{ exercise.name }}</h2>
        <p v-if="!canSwap" class="small muted">Des séries sont déjà validées sur cet exercice : termine-le ou fais-le plus tard.</p>
        <ul v-else-if="options.length" class="list-plain opts">
          <li v-for="o in options" :key="o.id">
            <button type="button" class="opt" @click="emit('swap', o.id)">
              <ExerciseThumb :exercise="o" size="sm" :animate="false" :interactive="false" />
              <span>
                {{ o.name }}
                <span v-if="o.name === plannedName" class="small muted d-block">exercice prévu</span>
              </span>
              <AppIcon name="right" :size="18" />
            </button>
          </li>
        </ul>
        <p v-else class="small muted">Pas d’alternative prévue pour cet exercice.</p>
        <p v-if="canSwap && options.length" class="small muted">Mêmes séries et répétitions. Chaque exercice garde son propre historique de charges.</p>
        <button v-if="canPostpone" type="button" class="btn block" @click="emit('postpone')">
          <AppIcon name="timer" /> Faire plus tard (en fin de séance)
        </button>
      </template>
    </div>
  </dialog>
</template>

<style scoped>
.muscles-body { display: flex; gap: 0.9rem; align-items: center; }
.sheet {
  width: 100%;
  max-width: 720px;
  max-height: 88dvh;
  margin: auto auto 0;
  padding: 0;
  border: 0;
  border-radius: 20px 20px 0 0;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
}
.sheet::backdrop { background: rgba(0, 0, 0, 0.55); }
.sheet[open] { animation: up 0.22s ease-out; }
@keyframes up { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
.sheet-inner { padding: 0.5rem 1rem calc(1.25rem + var(--safe-bottom)); display: flex; flex-direction: column; gap: 0.85rem; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; }
.sheet-head .eyebrow { margin: 0; }
.title { font-size: 1.25rem; margin: 0; }
.cue { margin: 0; }
h3 { font-size: 0.95rem; margin: 0 0 0.25rem; }
section ul { margin: 0; }
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
