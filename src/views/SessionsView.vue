<script setup lang="ts">
import { sessions } from '@/data/sessions'
import { weekTemplate } from '@/data/week'
import AppIcon from '@/components/AppIcon.vue'

const dayOf = (id: string) => weekTemplate.find((d) => d.sessionId === id)?.label.slice(0, 3)
const gym = sessions.filter((s) => s.category === 'principale')
const home = sessions.filter((s) => s.category === 'maison')
const backup = sessions.filter((s) => s.category === 'imprevu')
</script>

<template>
  <div class="sessions">
    <h1>Séances</h1>

    <section aria-labelledby="gym-title">
      <h2 id="gym-title" class="group-title">Salle · prioritaires</h2>
      <ul class="list-plain list">
        <li v-for="s in gym" :key="s.id">
          <RouterLink :to="`/seances/${s.id}`" class="item">
            <span class="day">{{ dayOf(s.id) }}</span>
            <span class="text"><strong>{{ s.name }}</strong><span class="small muted">{{ s.focus }}</span></span>
            <AppIcon name="right" :size="18" class="chev" />
          </RouterLink>
        </li>
      </ul>
    </section>

    <section aria-labelledby="home-title">
      <h2 id="home-title" class="group-title">Maison · légères, RIR 3</h2>
      <ul class="list-plain list">
        <li v-for="s in home" :key="s.id">
          <RouterLink :to="`/seances/${s.id}`" class="item">
            <span class="day home">{{ dayOf(s.id) }}</span>
            <span class="text">
              <strong>{{ s.name }}</strong>
              <span class="small muted">{{ s.focus }} · {{ s.duration }}<template v-if="s.optional"> · optionnelle</template></span>
            </span>
            <AppIcon name="right" :size="18" class="chev" />
          </RouterLink>
        </li>
      </ul>
    </section>

    <details class="fold">
      <summary>Séances de secours <span class="small muted">semaine chargée, 3 séances</span></summary>
      <ul class="list-plain list">
        <li v-for="s in backup" :key="s.id">
          <RouterLink :to="`/seances/${s.id}`" class="item">
            <AppIcon name="alert" :size="18" class="day-icon" />
            <span class="text"><strong>{{ s.name }}</strong><span class="small muted">{{ s.duration }}</span></span>
            <AppIcon name="right" :size="18" class="chev" />
          </RouterLink>
        </li>
      </ul>
    </details>

    <RouterLink to="/exercices" class="all">Toutes les fiches exercices <AppIcon name="right" :size="16" /></RouterLink>
  </div>
</template>

<style scoped>
.sessions { display: flex; flex-direction: column; gap: 1.5rem; }
h1 { margin: 0; }
.group-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0.4rem; }
.list { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.list li + li { margin-top: 0; border-top: 1px solid var(--border); }
.item {
  display: grid;
  grid-template-columns: 2.6rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 62px;
  padding: 0.5rem 1rem;
  color: inherit;
  text-decoration: none;
}
.day { font-weight: 800; font-size: 0.85rem; color: var(--accent); text-transform: uppercase; }
.day.home { color: var(--home); }
.day-icon { color: var(--muted); }
.text { display: flex; flex-direction: column; }
.chev { color: var(--muted); }
.fold > summary { cursor: pointer; min-height: 48px; display: flex; align-items: center; gap: 0.5rem; font-weight: 700; margin-bottom: 0.4rem; }
.all { display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 600; min-height: 44px; }
</style>
