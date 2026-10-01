<script setup lang="ts">
// Liste sobre des blocs d'une séance : une ligne par exercice (nom + volume),
// le repos et la consigne clé en petit dessous.
import { computed } from 'vue'
import type { ItemExercise, Session, SessionItem } from '@/data/types'
import { exercisesById } from '@/data/exercises'
import { formatTarget } from '@/lib/format'
import { pickVariant, variantOf, variantTarget } from '@/lib/home'
import { effectiveTarget, exerciseSetCount, itemSetCount } from '@/lib/plan'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ session: Session }>()
const settings = useSettingsStore()
const week = computed(() => settings.week)
const isMain = computed(() => props.session.category === 'principale')
const deload = computed(() => week.value.isDeload && (isMain.value || props.session.location === 'home'))

const count = (item: SessionItem) => itemSetCount(item, props.session, { deload: deload.value })

function line(item: SessionItem, ie: ItemExercise) {
  const exercise = exercisesById[ie.exerciseId]
  const n = exerciseSetCount(ie, item, count(item))
  const variant = exercise ? variantOf(exercise, pickVariant(exercise, settings.settings.homeEquipment)) : null
  const base = isMain.value ? effectiveTarget(ie.target, exercise, week.value.block) : ie.target
  const target = formatTarget(variantTarget(base, variant), variant?.perSide ?? ie.perSide)
  let volume: string
  if (item.format === 'activite') volume = target
  else if (item.format === 'circuit') volume = n === count(item) ? target : item.sets > 1 ? `${target} · ${n} tours` : `${target} × ${n}`
  else volume = `${n} × ${target}`
  return { name: exercise?.name ?? ie.exerciseId, variant: variant?.label, volume }
}

const groupTitle = (item: SessionItem) => {
  if (item.format === 'superset') return 'Superset'
  if (item.format === 'circuit') return count(item) > 1 ? `${item.label} · ${count(item)} tours` : item.label
  return item.label
}
</script>

<template>
  <ol class="items list-plain">
    <li v-for="(item, i) in session.items" :key="item.id" class="item">
      <span class="idx" aria-hidden="true">{{ i + 1 }}</span>
      <div class="body">
        <p v-if="item.exercises.length > 1 || item.format === 'activite'" class="group">{{ groupTitle(item) }}</p>
        <ul class="list-plain lines">
          <li v-for="ie in item.exercises" :key="ie.exerciseId" class="line">
            <RouterLink :to="`/exercices/${ie.exerciseId}`" class="name">{{ line(item, ie).name }}</RouterLink>
            <span class="vol num">{{ line(item, ie).volume }}</span>
            <span v-if="line(item, ie).variant" class="variant small muted">{{ line(item, ie).variant }}</span>
          </li>
        </ul>
        <p class="meta small muted">
          <template v-if="item.rest.max > 0">Repos {{ item.restLabel }} · </template>{{ item.cue }}
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.items { display: flex; flex-direction: column; }
.item { display: grid; grid-template-columns: 1.6rem 1fr; gap: 0.5rem; padding: 0.85rem 0; border-top: 1px solid var(--border); }
.items > li + li { margin-top: 0; }
.item:first-child { border-top: 0; }
.idx { font-weight: 800; color: var(--muted); padding-top: 0.1rem; }
.group { font-weight: 700; margin: 0 0 0.3rem; }
.lines { display: flex; flex-direction: column; gap: 0.25rem; }
.lines > li + li { margin-top: 0; }
.line { display: grid; grid-template-columns: 1fr auto; gap: 0 0.75rem; align-items: baseline; }
.name { font-weight: 600; text-decoration: none; color: var(--text); }
.name:hover, .name:focus-visible { color: var(--accent); text-decoration: underline; }
.vol { font-weight: 700; white-space: nowrap; }
.variant { grid-column: 1 / -1; }
.meta { margin: 0.35rem 0 0; }
</style>
