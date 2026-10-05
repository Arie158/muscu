<script setup lang="ts">
// Étiquettes des parties du corps travaillées par un exercice :
// ciblées (accentuées) puis sollicitées en second (discrètes, masquables).
import { computed } from 'vue'
import type { Exercise } from '@/data/types'
import { exerciseBodyParts } from '@/lib/muscles'

const props = withDefaults(defineProps<{ exercise: Exercise; secondary?: boolean }>(), { secondary: true })
const parts = computed(() => exerciseBodyParts(props.exercise))
</script>

<template>
  <span v-if="parts.primary.length" class="parts">
    <span class="sr-only">Travaille :</span>
    <span v-for="p in parts.primary" :key="p.label" class="badge accent">{{ p.label }}</span>
    <template v-if="secondary && parts.secondary.length">
      <span class="sr-only">; sollicite aussi :</span>
      <span v-for="p in parts.secondary" :key="p.label" class="badge sec">{{ p.label }}</span>
    </template>
  </span>
</template>

<style scoped>
.parts { display: flex; flex-wrap: wrap; gap: 0.25rem; margin: 0.25rem 0 0; }
.badge { font-size: 0.72rem; padding: 0.05rem 0.45rem; }
.sec { color: var(--muted); background: none; }
</style>
