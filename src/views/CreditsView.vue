<script setup lang="ts">
import { imageCredits, libraryCredits } from '@/data/credits'
import { exercises } from '@/data/exercises'
import PageHeader from '@/components/PageHeader.vue'

const approx = exercises.filter((e) => e.illustration.confidence === 'approximatif')
</script>

<template>
  <div class="stack">
    <PageHeader title="Crédits" />
    <section class="card">
      <h2>Illustrations des exercices</h2>
      <p>
        Source : <a :href="imageCredits.url" target="_blank" rel="noopener noreferrer">{{ imageCredits.source }}</a><br />
        Licence : <a :href="imageCredits.licenseUrl" target="_blank" rel="noopener noreferrer">{{ imageCredits.license }}</a>
      </p>
      <p class="small">{{ imageCredits.note }}</p>
      <p class="small muted">Illustrations d’exercices similaires : {{ approx.map((e) => e.name).join(', ') }}.</p>
    </section>
    <section class="card">
      <h2>Logiciels</h2>
      <ul>
        <li v-for="l in libraryCredits" :key="l.name">
          <a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.name }}</a> — {{ l.license }}
        </li>
      </ul>
    </section>
    <section class="card">
      <h2>Mentions</h2>
      <p class="small">
        Application personnelle de suivi. Le contenu est informatif et ne remplace pas l’avis d’un médecin,
        d’un diététicien ou d’un professionnel de santé. Aucune donnée n’est collectée : tout reste dans le navigateur.
      </p>
    </section>
  </div>
</template>
