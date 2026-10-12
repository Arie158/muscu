<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  title: string
  subtitle?: string
  back?: string
  backLabel?: string
  /** Revenir à la page d'origine (séance, carnet, liste filtrée…) ; `back` ne sert que si on arrive directement. */
  backToPrevious?: boolean
}>()

const router = useRouter()
/** Page précédente dans l'app (null si la page a été ouverte directement, par un lien ou un favori). */
const previous = computed(() => {
  if (!props.backToPrevious) return null
  const path = router.options.history.state.back
  return typeof path === 'string' ? router.resolve(path) : null
})
const label = computed(() => (previous.value ? (previous.value.meta.title as string | undefined) ?? 'Retour' : (props.backLabel ?? 'Retour')))
</script>

<template>
  <header class="page-header">
    <button v-if="previous" type="button" class="back" @click="router.back()">
      <AppIcon name="left" :size="18" />
      {{ label }}
    </button>
    <RouterLink v-else-if="back" :to="back" class="back">
      <AppIcon name="left" :size="18" />
      {{ label }}
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
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
</style>
