<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import AppFooter from './components/AppFooter.vue'
import { useSettingsStore } from './stores/settings'

const route = useRoute()
// Applique le thème enregistré dès le démarrage (le store pose data-theme sur <html>).
useSettingsStore()
const immersive = computed(() => route.meta.immersive === true)
</script>

<template>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <main id="contenu" class="container" tabindex="-1" :class="{ immersive }">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
    <AppFooter v-if="!immersive" />
  </main>
  <BottomNav v-if="!immersive" />
</template>

<style scoped>
main:focus { outline: none; }
.immersive { padding-bottom: 9rem; }
</style>
