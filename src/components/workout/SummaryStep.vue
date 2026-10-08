<script setup lang="ts">
// Dernière étape du mode séance : bilan par bloc, notes, enregistrement.
import { computed, ref } from 'vue'
import { COOLDOWN_CARDIO, LOWER_MOBILITY } from '@/data/sessions'
import type { Session } from '@/data/types'
import { useActiveStore, type ActiveSession } from '@/stores/active'
import AppIcon from '../AppIcon.vue'

const props = defineProps<{ session: Session; active: ActiveSession }>()
const emit = defineEmits<{ finish: []; abandon: []; add: [] }>()
const store = useActiveStore()
const heading = ref<HTMLElement | null>(null)
defineExpose({ heading })

const isHome = computed(() => props.session.location === 'home')
const isLower = computed(() => props.session.id.startsWith('bas'))
const count = (i: number, onlyDone: boolean) =>
  props.active.items[i]?.exercises.reduce((n, e) => n + e.sets.filter((s) => !onlyDone || s.done).length, 0) ?? 0
</script>

<template>
  <section class="stack">
    <h1 ref="heading" tabindex="-1">Bilan</h1>
    <ul class="list-plain summary">
      <li v-for="(i, pos) in store.order" :key="active.items[i]!.itemId">
        <button type="button" class="summary-item" @click="store.goTo(pos + 1)">
          <span>{{ store.itemDef(i)?.label }}<span v-if="active.items[i]?.extra" class="small muted d-block">ajouté hors programme</span></span>
          <span class="badge" :class="count(i, true) === count(i, false) ? 'ok' : 'warn'">{{ count(i, true) }} / {{ count(i, false) }}</span>
        </button>
      </li>
    </ul>
    <button type="button" class="btn block add-extra" @click="emit('add')">
      <AppIcon name="plus" /> Ajouter un exercice non prévu
    </button>
    <div class="field">
      <label for="notes">Notes <span class="hint">(sensations, douleur, machine…)</span></label>
      <textarea id="notes" v-model="active.notes" />
    </div>
    <p v-if="!isHome" class="small muted">{{ COOLDOWN_CARDIO }}<template v-if="isLower"> {{ LOWER_MOBILITY }}</template></p>
    <button type="button" class="btn primary lg block" :disabled="store.doneSets === 0" @click="emit('finish')">
      <AppIcon name="check" /> Enregistrer la séance
    </button>
    <p v-if="store.doneSets === 0" class="small muted">Valide au moins une série pour enregistrer.</p>
    <button type="button" class="btn ghost block danger-text" @click="emit('abandon')">Abandonner la séance</button>
  </section>
</template>

<style scoped>
h1:focus { outline: none; }
.summary { display: flex; flex-direction: column; gap: 0.4rem; }
.summary > li + li { margin-top: 0; }
.summary-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0.5rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.danger-text { color: var(--danger); }
.add-extra { border-style: dashed; color: var(--muted); }
.d-block { display: block; }
</style>
