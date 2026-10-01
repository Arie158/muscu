<script setup lang="ts">
// Compte à rebours d'une série chronométrée (gainage, étirement, isométrique).
// En mode « par côté », le chrono dure 2 × la cible et signale le changement de côté.
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ seconds: number; perSide?: string; label: string }>()
const emit = defineEmits<{ finished: [seconds: number] }>()

const total = computed(() => props.seconds * (props.perSide ? 2 : 1))
const endsAt = ref<number | null>(null)
const now = ref(Date.now())
const announce = ref('')
let timer: number | undefined
let switched = false

const left = computed(() => (endsAt.value ? Math.max(0, Math.ceil((endsAt.value - now.value) / 1000)) : total.value))
const phase = computed(() => (props.perSide && left.value > props.seconds ? '1er côté' : props.perSide ? '2e côté' : ''))

function buzz(pattern: number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

function tick() {
  now.value = Date.now()
  if (props.perSide && !switched && left.value <= props.seconds) {
    switched = true
    announce.value = 'Change de côté'
    buzz([200])
  }
  if (left.value === 0) {
    stop()
    announce.value = 'Terminé'
    buzz([300, 150, 300])
    emit('finished', props.seconds)
  }
}
function start() {
  switched = false
  announce.value = ''
  endsAt.value = Date.now() + total.value * 1000
  now.value = Date.now()
  window.clearInterval(timer)
  timer = window.setInterval(tick, 250)
}
function stop() {
  window.clearInterval(timer)
  endsAt.value = null
}
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="countdown">
    <span class="sr-only" aria-live="assertive">{{ announce }}</span>
    <button v-if="!endsAt" type="button" class="btn" @click="start">
      <AppIcon name="timer" /> Chrono {{ seconds }} s{{ perSide ? ` / ${perSide}` : '' }}
    </button>
    <template v-else>
      <span class="time num" role="timer" :aria-label="`${label} : ${left} secondes restantes`">{{ left }} s</span>
      <span v-if="phase" class="badge accent">{{ phase }}</span>
      <button type="button" class="btn ghost" @click="stop">Arrêter</button>
    </template>
  </div>
</template>

<style scoped>
.countdown { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
.time { font-size: 1.8rem; font-weight: 800; min-width: 4.5rem; }
</style>
