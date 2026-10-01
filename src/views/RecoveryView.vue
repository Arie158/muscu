<script setup lang="ts">
import { recovery } from '@/data/recovery'
import PageHeader from '@/components/PageHeader.vue'
</script>

<template>
  <div class="stack">
    <PageHeader title="Récupération" subtitle="Le muscle se construit au repos." />
    <section class="card">
      <h2>Règles</h2>
      <ul>
        <li v-for="r in recovery.rules" :key="r">{{ r }}</li>
      </ul>
    </section>
    <section class="card">
      <h2>Signes de fatigue excessive</h2>
      <ul>
        <li v-for="s in recovery.fatigueSigns" :key="s">{{ s }}</li>
      </ul>
      <div class="callout warn"><p>{{ recovery.fatigueAction }}</p></div>
    </section>
    <p class="small muted">Sommeil et énergie se notent chaque jour dans <RouterLink to="/suivi">Suivi</RouterLink>.</p>
  </div>
</template>
