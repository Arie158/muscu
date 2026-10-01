<script setup lang="ts">
import { contingencies, contingencyGolden, RESUME_MODE_DAYS } from '@/data/contingencies'
import { PRIORITY_ORDER, sessionsById } from '@/data/sessions'
import { alertActions } from '@/data/home'
import { formatFull } from '@/lib/dates'
import { skipOrder } from '@/lib/priority'
import { useSettingsStore } from '@/stores/settings'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const skips = skipOrder()
</script>

<template>
  <div class="stack">
    <PageHeader title="Imprévus" subtitle="Que faire quand la semaine ne se passe pas comme prévu." />
    <div class="callout ok"><p><strong>{{ contingencyGolden }}</strong></p></div>

    <section class="card" aria-labelledby="prio-title">
      <h2 id="prio-title">Priorité des séances</h2>
      <ol class="prio">
        <li v-for="id in PRIORITY_ORDER" :key="id">
          <RouterLink :to="`/seances/${id}`">{{ sessionsById[id].name }}</RouterLink>
          <span class="badge" :class="sessionsById[id].location === 'home' ? 'home' : 'accent'">
            {{ sessionsById[id].location === 'home' ? 'Maison' : 'Salle' }}
          </span>
          <span class="small muted">priorité {{ sessionsById[id].priority }}</span>
        </li>
      </ol>
      <p class="small muted">Les 4 séances salle d’abord (Bas A et Bas B en tête), puis Maison 2, Maison 1, Maison 3.</p>
      <h3>Si tu dois sauter des séances</h3>
      <p class="small">Dans cet ordre : {{ skips.map((id) => sessionsById[id].name).join(' → ') }}.</p>
      <h3>Fatigue, mauvais sommeil, charges en baisse</h3>
      <ol class="small">
        <li v-for="a in alertActions.general" :key="a">{{ a }}</li>
      </ol>
      <p class="small">{{ alertActions.upperDrop }}</p>
    </section>

    <section v-for="c in contingencies" :key="c.id" class="card stack-sm" :aria-labelledby="`c-${c.id}`">
      <h2 :id="`c-${c.id}`">{{ c.title }}</h2>
      <ul>
        <li v-for="s in c.steps" :key="s">{{ s }}</li>
      </ul>
      <div v-if="c.sessions" class="row">
        <RouterLink v-for="sid in c.sessions" :key="sid" :to="`/seances/${sid}`" class="btn">
          {{ sessionsById[sid].name }}
        </RouterLink>
      </div>
      <template v-if="c.enablesResumeMode">
        <div v-if="settings.resumeActive" class="callout warn">
          <p>Mode reprise actif jusqu’au {{ formatFull(settings.settings.resumeUntil!) }}.</p>
          <button type="button" class="btn" @click="settings.stopResumeMode()">Désactiver</button>
        </div>
        <button v-else type="button" class="btn primary" @click="settings.startResumeMode()">
          <AppIcon name="play" /> Activer le mode reprise ({{ RESUME_MODE_DAYS }} jours)
        </button>
        <p class="small muted">Le mode séance appliquera automatiquement −10 % sur les charges et 1 série de moins (séances salle).</p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.prio li { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
</style>
