<script setup lang="ts">
import AppIcon, { type IconName } from '@/components/AppIcon.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()

const groups: { title: string; links: { to: string; label: string; desc: string; icon: IconName }[] }[] = [
  {
    title: 'Programme',
    links: [
      { to: '/plan', label: 'Plan de 26 semaines', desc: 'Blocs, décharges, RIR de la semaine', icon: 'calendar' },
      { to: '/progression', label: 'Progression', desc: 'Que faire à la prochaine séance', icon: 'trend' },
      { to: '/imprevus', label: 'Imprévus', desc: 'Séance manquée, fatigue, semaine chargée', icon: 'alert' },
      { to: '/exercices', label: 'Exercices', desc: 'Fiches illustrées', icon: 'book' },
    ],
  },
  {
    title: 'Au quotidien',
    links: [
      { to: '/cardio', label: 'Cardio et pas', desc: 'Pas du jour, LISS', icon: 'steps' },
      { to: '/alimentation', label: 'Alimentation', desc: 'Repères et ajustements', icon: 'food' },
      { to: '/recuperation', label: 'Récupération', desc: 'Sommeil, fatigue, mobilité', icon: 'heart' },
    ],
  },
  {
    title: 'Application',
    links: [
      { to: '/parametres', label: 'Paramètres', desc: 'Date de début, matériel, sauvegarde', icon: 'settings' },
      { to: '/credits', label: 'Mentions et crédits', desc: 'Sources et licences', icon: 'info' },
    ],
  },
]
</script>

<template>
  <div class="stack">
    <PageHeader title="Plus" />
    <section v-for="g in groups" :key="g.title" :aria-labelledby="`g-${g.title}`">
      <h2 :id="`g-${g.title}`" class="group-title">{{ g.title }}</h2>
      <ul class="list-plain list">
        <li v-for="l in g.links" :key="l.to">
          <RouterLink :to="l.to" class="item">
            <AppIcon :name="l.icon" :size="22" />
            <span class="text">
              <strong>{{ l.label }}</strong>
              <span class="small muted">{{ l.desc }}</span>
            </span>
            <AppIcon name="right" :size="18" class="chev" />
          </RouterLink>
        </li>
      </ul>
    </section>
    <button type="button" class="item theme" @click="settings.toggleTheme()">
      <AppIcon :name="settings.settings.theme === 'dark' ? 'sun' : 'moon'" :size="22" />
      <span class="text"><strong>{{ settings.settings.theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre' }}</strong></span>
    </button>
  </div>
</template>

<style scoped>
.group-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0.4rem; }
.list { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.list li + li { margin-top: 0; border-top: 1px solid var(--border); }
.item {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 0.85rem;
  min-height: 60px;
  padding: 0.5rem 1rem;
  color: inherit;
  text-decoration: none;
}
.item > :first-child { color: var(--accent); }
.text { display: flex; flex-direction: column; }
.chev { color: var(--muted); }
.theme {
  width: 100%;
  grid-template-columns: 24px 1fr;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
</style>
