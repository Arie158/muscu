<script setup lang="ts">
import { computed } from 'vue'
import { blocks, PROGRAM_WEEKS } from '@/data/plan'
import { HOME_DELOAD_NOTE } from '@/data/home'
import { addDays, formatFull, formatShort } from '@/lib/dates'
import { rirForWeek } from '@/lib/plan'
import { useSettingsStore } from '@/stores/settings'
import PageHeader from '@/components/PageHeader.vue'

const settings = useSettingsStore()
const start = computed(() => settings.settings.startDate)
const current = computed(() => settings.week.week)

const weeksOf = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => {
    const w = from + i
    const monday = addDays(start.value, (w - 1) * 7)
    return { week: w, from: monday, to: addDays(monday, 6), rir: rirForWeek(w) }
  })
const endDate = computed(() => addDays(start.value, PROGRAM_WEEKS * 7 - 1))
</script>

<template>
  <div class="stack">
    <PageHeader title="Plan de 26 semaines" :subtitle="`Du ${formatFull(start)} au ${formatFull(endDate)}`">
      <RouterLink to="/parametres" class="small">Changer la date de début</RouterLink>
    </PageHeader>

    <div v-if="settings.week.status === 'en-cours'" class="card highlight">
      <p class="eyebrow">Semaine en cours</p>
      <p class="big-number">S{{ current }}</p>
      <p><strong>{{ settings.week.block?.name }}</strong> — {{ settings.week.block?.goal }}</p>
      <p v-if="settings.week.rir" class="small">
        RIR cible : {{ settings.week.rir.base }} (bases) · {{ settings.week.rir.isolation }} (isolations).
        {{ settings.week.rir.note }}
      </p>
    </div>
    <div v-else-if="settings.week.status === 'avant'" class="callout">
      <p>Le programme n’a pas encore commencé (J−{{ settings.week.daysUntilStart }}).</p>
    </div>

    <section v-for="b in blocks" :key="b.id" class="card block" :class="{ deload: b.deload }" :aria-labelledby="`b-${b.id}`">
      <div class="row-between">
        <h2 :id="`b-${b.id}`">{{ b.name }}</h2>
        <span class="badge" :class="b.deload ? 'warn' : 'accent'">
          {{ b.fromWeek === b.toWeek ? `S${b.fromWeek}` : `S${b.fromWeek}–S${b.toWeek}` }}
        </span>
      </div>
      <p>{{ b.goal }}</p>
      <p v-if="b.deload" class="small"><span class="badge home">Maison</span> {{ HOME_DELOAD_NOTE }}</p>
      <ol class="list-plain weeks">
        <li
          v-for="w in weeksOf(b.fromWeek, b.toWeek)"
          :key="w.week"
          :class="{ current: w.week === current }"
          :aria-current="w.week === current ? 'date' : undefined"
        >
          <span class="wk num">S{{ w.week }}</span>
          <span class="dates small">{{ formatShort(w.from) }} – {{ formatShort(w.to) }}</span>
          <span class="rir small">{{ w.rir?.base }}</span>
        </li>
      </ol>
    </section>

    <section class="card">
      <h2>Repères d’intensité</h2>
      <ul>
        <li>Semaines 1-2 : RIR 3 (calibrage).</li>
        <li>Semaines 3 à 6 : RIR 1-2 sur les bases, RIR 0-1 sur la dernière série des isolations.</li>
        <li>Blocs suivants : même règle (décision de l’app), RIR 3 en décharge.</li>
        <li>Jamais d’échec total sur squat, soulevé de terre roumain, développé couché.</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.block.deload { border-style: dashed; }
.weeks li {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
}
.weeks li + li { margin-top: 0.15rem; }
.weeks li.current { background: var(--accent-soft); outline: 2px solid var(--accent); }
.wk { font-weight: 800; }
.dates { color: var(--muted); }
.rir { font-weight: 600; }
.card p:last-child { margin-bottom: 0; }
</style>
