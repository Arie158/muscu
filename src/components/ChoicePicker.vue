<script setup lang="ts">
// Sélecteur à boutons (RIR 0-4, notes 1-5…). Un nouveau clic sur la valeur active l'efface.
defineProps<{ label: string; options: number[]; hideLabel?: boolean }>()
const model = defineModel<number | null | undefined>({ required: true })
</script>

<template>
  <div class="choice" role="group" :aria-label="label">
    <span v-if="!hideLabel" class="choice-label">{{ label }}</span>
    <div class="segmented">
      <button
        v-for="o in options"
        :key="o"
        type="button"
        :aria-pressed="model === o"
        :aria-label="`${label} ${o}`"
        @click="model = model === o ? null : o"
      >
        {{ o }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.choice-label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.3rem; }
.segmented button { flex: 1 1 0; }
</style>
