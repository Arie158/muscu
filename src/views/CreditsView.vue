<script setup lang="ts">
import { imageCredits, libraryCredits } from '@/data/credits'
import { exercises } from '@/data/exercises'
import PageHeader from '@/components/PageHeader.vue'

const approx = exercises.filter((e) => e.illustration.confidence === 'approximatif')
// Images wger.de : une ligne par image (un exercice et ses variantes peuvent partager la même).
const external = [...new Map(exercises.flatMap((e) => (e.illustration.external ? [[e.illustration.dbId, { name: e.name, ...e.illustration.external }]] : []))).values()]
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
      <template v-if="external.length">
        <p>
          Quelques images viennent de <a href="https://wger.de" target="_blank" rel="noopener noreferrer">wger.de</a>, sous licence
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> :
        </p>
        <ul class="small">
          <li v-for="x in external" :key="x.url">
            {{ x.name }} : <a :href="x.page" target="_blank" rel="noopener noreferrer">{{ x.author }}</a>
          </li>
        </ul>
      </template>
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
