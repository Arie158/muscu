<script setup lang="ts">
// Liste des séries / tours d'un bloc : la ligne en cours est dépliée, les autres tiennent
// sur une ligne (toucher = modifier). Gère la validation (vibration) et signale la fin du bloc.
import { computed, ref, watch } from 'vue'
import { firstOpenRow, isRowDone, rowCount, rowSummary } from '@/lib/workoutRows'
import { useActiveStore, type ActiveItem } from '@/stores/active'
import AppIcon from '../AppIcon.vue'
import SetEditor from './SetEditor.vue'

const props = defineProps<{ item: ActiveItem; itemIdx: number; format: 'simple' | 'superset' | 'circuit' | 'activite' }>()
const emit = defineEmits<{ finished: [] }>()
const store = useActiveStore()

/** Ligne dépliée par l'utilisateur ; null = la ligne en cours. */
const expanded = ref<number | null>(null)
watch(() => props.itemIdx, () => (expanded.value = null))

const rows = computed(() => rowCount(props.item.exercises))
const current = computed(() => firstOpenRow(props.item.exercises))
const rowLabel = computed(() => (props.format === 'circuit' ? 'Tour' : 'Série'))
const isOpen = (k: number) => (expanded.value ?? current.value) === k
const done = (k: number) => isRowDone(props.item.exercises, k)
const summary = (k: number) => rowSummary(props.item.exercises, k, (ex) => store.usesKg(ex))

function toggle(j: number, k: number) {
  const wasDone = !!props.item.exercises[j]?.sets[k]?.done
  const finished = store.toggleDone(props.itemIdx, j, k)
  if (!wasDone && 'vibrate' in navigator) navigator.vibrate(40)
  if (done(k)) expanded.value = null
  if (finished) emit('finished')
}
</script>

<template>
  <ol class="list-plain sets" :aria-label="`${rowLabel}s`">
    <li v-for="k in rows" :key="k" class="set" :class="{ open: isOpen(k - 1), done: done(k - 1) }">
      <button
        v-if="!isOpen(k - 1)"
        type="button"
        class="set-summary"
        :aria-label="`${rowLabel} ${k} : ${summary(k - 1)}${done(k - 1) ? ', faite' : ''} — modifier`"
        @click="expanded = k - 1"
      >
        <span class="set-num">{{ rowLabel }} {{ k }}</span>
        <span class="set-values num">{{ summary(k - 1) }}</span>
        <AppIcon v-if="done(k - 1)" name="check" class="set-check" />
      </button>
      <SetEditor v-else :item="item" :item-idx="itemIdx" :k="k - 1" :rows="rows" :row-label="rowLabel" @toggle="(j) => toggle(j, k - 1)" />
    </li>
  </ol>
</template>

<style scoped>
.sets { display: flex; flex-direction: column; gap: 0.4rem; }
.sets > li + li { margin-top: 0; }
.set { border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); }
.set.open { border-color: var(--accent); }
.set-summary {
  width: 100%;
  min-height: 52px;
  display: grid;
  grid-template-columns: 4.2rem 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  background: none;
  border: 0;
  color: var(--muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.set.done .set-summary { color: var(--text); }
.set-num { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
.set-values { font-weight: 600; }
.set-check { color: var(--ok); }
</style>
