<script setup lang="ts">
// 4 entrées seulement : ce qui sert tous les jours. Le reste (plan, progression, cardio,
// alimentation, imprévus, paramètres…) est regroupé dans « Plus ».
import AppIcon, { type IconName } from './AppIcon.vue'

const links: { to: string; label: string; icon: IconName; exact?: boolean }[] = [
  { to: '/', label: 'Aujourd’hui', icon: 'home', exact: true },
  { to: '/seances', label: 'Séances', icon: 'dumbbell' },
  { to: '/suivi', label: 'Suivi', icon: 'chart' },
  { to: '/plus', label: 'Plus', icon: 'menu' },
]
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigation principale">
    <RouterLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="nav-link"
      :exact-active-class="l.exact ? 'active' : ''"
      :active-class="l.exact ? '' : 'active'"
    >
      <AppIcon :name="l.icon" />
      <span>{{ l.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--nav-h) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
}
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-decoration: none;
  min-width: 0;
}
.nav-link.active { color: var(--accent); }
.nav-link.active :deep(svg) { stroke-width: 2.5; }
.nav-link :deep(svg) { width: 24px; height: 24px; }
@media (min-width: 720px) {
  .bottom-nav { max-width: 720px; margin: 0 auto; border-left: 1px solid var(--border); border-right: 1px solid var(--border); border-radius: 16px 16px 0 0; }
}
</style>
