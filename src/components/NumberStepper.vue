<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{ label: string; step?: number; min?: number; max?: number; unit?: string; disabled?: boolean }>(),
  { step: 1, min: 0, max: 9999, unit: '', disabled: false },
)
const model = defineModel<number | null>({ required: true })

const display = computed({
  get: () => (model.value === null ? '' : String(model.value)),
  set: (v: string) => {
    const n = parseFloat(v.replace(',', '.'))
    model.value = Number.isFinite(n) ? n : null
  },
})

function bump(dir: 1 | -1) {
  const current = model.value ?? 0
  const next = Math.round((current + dir * props.step) * 100) / 100
  model.value = Math.min(props.max, Math.max(props.min, next))
}
</script>

<template>
  <div class="stepper" :class="{ disabled }">
    <button type="button" class="btn icon" :aria-label="`${label} : moins ${step}`" :disabled="disabled" @click="bump(-1)">
      <AppIcon name="minus" />
    </button>
    <input
      v-model.lazy="display"
      type="text"
      inputmode="decimal"
      :aria-label="`${label}${unit ? ` (${unit})` : ''}`"
      :disabled="disabled"
      enterkeyhint="done"
      @focus="($event.target as HTMLInputElement).select()"
    />
    <button type="button" class="btn icon" :aria-label="`${label} : plus ${step}`" :disabled="disabled" @click="bump(1)">
      <AppIcon name="plus" />
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: grid;
  grid-template-columns: var(--tap) minmax(0, 1fr) var(--tap);
  gap: 0.3rem;
  align-items: center;
}
.stepper input {
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.4rem 0.2rem;
  font-variant-numeric: tabular-nums;
}
.stepper .btn { padding: 0; }
</style>
