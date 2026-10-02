<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Exercise, Illustration } from '@/data/types'
import { usePrefersReducedMotion } from '@/composables/usePrefersReducedMotion'
import AppIcon from './AppIcon.vue'
import { exerciseImage } from '@/lib/images'

// `illustration` / `videoQuery` : surcharges propres à une variante de matériel (exercices maison).
const props = withDefaults(
  defineProps<{ exercise: Exercise; compact?: boolean; illustration?: Illustration; videoQuery?: string }>(),
  { compact: false, illustration: undefined, videoQuery: undefined },
)
const illus = computed(() => props.illustration ?? props.exercise.illustration)

const reduced = usePrefersReducedMotion()
const frame = ref(0)
const playing = ref(!reduced.value)
const failed = ref(false)
let timer: number | undefined

const dbId = computed(() => illus.value.dbId)
const hasImage = computed(() => !!dbId.value && illus.value.confidence !== 'aucune' && !failed.value)
const src = (i: number) => exerciseImage(dbId.value!, i)
const videoUrl = computed(
  () => `https://www.youtube.com/results?search_query=${encodeURIComponent(props.videoQuery ?? props.exercise.videoQuery)}`,
)
const regionIcon = computed(() => ({ haut: 'upper', bas: 'lower', tronc: 'core', global: 'heart' } as const)[props.exercise.region])
const regionLabel = computed(() => ({ haut: 'Haut du corps', bas: 'Bas du corps', tronc: 'Tronc / abdominaux', global: 'Cardio et mobilité' })[props.exercise.region])

function tick() {
  frame.value = frame.value === 0 ? 1 : 0
}
watch(
  playing,
  (p) => {
    window.clearInterval(timer)
    if (p) timer = window.setInterval(tick, 1300)
  },
  { immediate: true },
)
watch(reduced, (r) => {
  if (r) playing.value = false
})
watch(dbId, () => {
  failed.value = false
  frame.value = 0
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <figure class="illus" :class="{ compact }">
    <div v-if="hasImage" class="frame">
      <img
        v-for="i in [0, 1]"
        :key="i"
        :src="src(i)"
        :alt="`${exercise.name} — ${i === 0 ? 'position de départ' : 'position finale'}`"
        :class="{ visible: frame === i }"
        :aria-hidden="frame !== i"
        width="850"
        height="567"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      />
      <div class="controls">
        <span class="badge">{{ frame === 0 ? 'Départ' : 'Fin' }}</span>
        <button
          type="button"
          class="btn icon"
          :aria-label="playing ? 'Mettre l’animation en pause' : 'Lancer l’animation'"
          :aria-pressed="!playing"
          @click="playing = !playing"
        >
          <AppIcon :name="playing ? 'pause' : 'play'" />
        </button>
        <button v-if="!playing" type="button" class="btn icon" aria-label="Image suivante" @click="tick">
          <AppIcon name="right" />
        </button>
      </div>
    </div>
    <div v-else class="placeholder" role="img" :aria-label="`Pas d’illustration disponible — ${regionLabel}`">
      <AppIcon :name="regionIcon" :size="64" />
      <span>{{ regionLabel }}</span>
    </div>
    <figcaption v-if="!compact" class="small">
      <span v-if="hasImage && illus.confidence === 'approximatif'" class="badge warn">
        Illustration d’un exercice similaire
      </span>
      <span v-if="illus.note" class="muted">{{ illus.note }}</span>
      <a :href="videoUrl" target="_blank" rel="noopener noreferrer" class="video-link">
        <AppIcon name="video" :size="18" /> Voir une démonstration vidéo
        <span class="sr-only">(YouTube, nouvel onglet)</span>
      </a>
    </figcaption>
  </figure>
</template>

<style scoped>
.illus { margin: 0; }
.frame, .placeholder {
  position: relative;
  aspect-ratio: 850 / 567;
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
}
.frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.35s ease;
}
.frame img.visible { opacity: 1; }
.controls {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.controls .btn { background: rgba(17, 21, 28, 0.78); color: #fff; border-color: transparent; }
.controls .badge { background: rgba(17, 21, 28, 0.78); color: #fff; border-color: transparent; }
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--surface-2);
  color: var(--muted);
  font-weight: 600;
}
.compact .frame, .compact .placeholder { border-radius: var(--radius-sm); }
figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.75rem;
  align-items: center;
  margin-top: 0.5rem;
}
.video-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 40px;
  font-weight: 600;
}
</style>
