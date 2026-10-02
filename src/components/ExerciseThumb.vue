<script setup lang="ts">
// Miniature d'un exercice (départ ↔ fin en alternance douce), cliquable pour ouvrir le geste.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Exercise, Illustration } from '@/data/types'
import { usePrefersReducedMotion } from '@/composables/usePrefersReducedMotion'
import AppIcon from './AppIcon.vue'
import { exerciseImage } from '@/lib/images'

const props = withDefaults(
  defineProps<{ exercise: Exercise; illustration?: Illustration; size?: 'sm' | 'md'; animate?: boolean; label?: string; interactive?: boolean }>(),
  { illustration: undefined, size: 'md', animate: true, label: undefined, interactive: true },
)
defineEmits<{ open: [] }>()

const reduced = usePrefersReducedMotion()
const illus = computed(() => props.illustration ?? props.exercise.illustration)
const failed = ref(false)
const hasImage = computed(() => !!illus.value.dbId && illus.value.confidence !== 'aucune' && !failed.value)
const frame = ref(0)
let timer: number | undefined

watch(
  [() => props.animate, reduced, hasImage],
  ([anim, red, img]) => {
    window.clearInterval(timer)
    frame.value = 0
    if (anim && !red && img) timer = window.setInterval(() => (frame.value = frame.value ? 0 : 1), 1600)
  },
  { immediate: true },
)
watch(() => illus.value.dbId, () => (failed.value = false))
onBeforeUnmount(() => window.clearInterval(timer))
const icon = computed(() => ({ haut: 'upper', bas: 'lower', tronc: 'core', global: 'heart' } as const)[props.exercise.region])
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="thumb"
    :class="size"
    :aria-label="interactive ? (label ?? `Voir le geste : ${exercise.name}`) : undefined"
    :aria-hidden="interactive ? undefined : 'true'"
    @click="interactive && $emit('open')"
  >
    <template v-if="hasImage">
      <img
        v-for="i in [0, 1]"
        v-show="frame === i"
        :key="i"
        :src="exerciseImage(illus.dbId!, i, 'thumb')"
        alt=""
        width="240"
        height="160"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      />
    </template>
    <AppIcon v-else :name="icon" :size="size === 'sm' ? 20 : 26" />
    <span v-if="interactive" class="zoom" aria-hidden="true"><AppIcon name="plus" :size="12" /></span>
  </component>
</template>

<style scoped>
.thumb {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  color: var(--muted);
  overflow: hidden;
  cursor: pointer;
}
.thumb.md { width: 84px; height: 56px; }
.thumb.sm { width: 54px; height: 36px; border-radius: 8px; }
.thumb:has(svg:only-child), .thumb:not(:has(img)) { background: var(--surface-2); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.zoom {
  position: absolute;
  right: 3px;
  bottom: 3px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(17, 21, 28, 0.75);
  color: #fff;
}
.thumb.sm .zoom { display: none; }
</style>
