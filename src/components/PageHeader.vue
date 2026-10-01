<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ title: string; subtitle?: string; back?: string; backLabel?: string }>()
</script>

<template>
  <header class="page-header">
    <RouterLink v-if="back" :to="back" class="back">
      <AppIcon name="left" :size="18" />
      {{ backLabel ?? 'Retour' }}
    </RouterLink>
    <h1>{{ title }}</h1>
    <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    <slot />
  </header>
</template>

<style scoped>
.page-header { margin-bottom: 1.25rem; }
.page-header p { margin: 0; }
.back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 40px;
  margin-bottom: 0.25rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
