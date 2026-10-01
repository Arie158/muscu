<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useActiveStore } from '@/stores/active'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from './AppIcon.vue'

const store = useActiveStore()
const settings = useSettingsStore()
const now = ref(Date.now())
const announce = ref('')
let notifiedFor: number | null = null
const interval = window.setInterval(() => (now.value = Date.now()), 250)
onBeforeUnmount(() => window.clearInterval(interval))

const rest = computed(() => store.active?.rest)
const running = computed(() => !!rest.value?.endsAt)
const paused = computed(() => rest.value?.pausedLeft !== null && rest.value?.pausedLeft !== undefined)
const visible = computed(() => running.value || paused.value)
const left = computed(() => {
  const r = rest.value
  if (!r) return 0
  if (r.endsAt) return Math.max(0, Math.ceil((r.endsAt - now.value) / 1000))
  return r.pausedLeft ?? 0
})
const finished = computed(() => running.value && left.value === 0)
const progress = computed(() => (rest.value?.total ? 1 - left.value / rest.value.total : 0))
const mmss = computed(() => `${Math.floor(left.value / 60)}:${String(left.value % 60).padStart(2, '0')}`)

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ;[0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.2)
    })
    window.setTimeout(() => ctx.close(), 1000)
  } catch {
    /* audio indisponible */
  }
}

watch(finished, (f) => {
  const endsAt = rest.value?.endsAt ?? null
  if (!f || endsAt === notifiedFor) return
  notifiedFor = endsAt
  announce.value = 'Repos terminé, série suivante !'
  if ('vibrate' in navigator) navigator.vibrate([300, 150, 300, 150, 300])
  if (settings.settings.sound) beep()
})
</script>

<template>
  <div class="sr-only" aria-live="assertive">{{ announce }}</div>
  <section v-if="visible" class="rest" :class="{ finished }" aria-label="Minuteur de repos">
    <div class="bar" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true" />
    <div class="inner">
      <div class="time-block">
        <span class="label small">{{ finished ? 'C’est reparti !' : rest?.label }}</span>
        <span class="time num" role="timer" :aria-label="`Repos restant ${mmss}`">{{ mmss }}</span>
      </div>
      <div class="actions">
        <button type="button" class="btn icon" aria-label="Retirer 15 secondes" @click="store.addRest(-15)">−15</button>
        <button type="button" class="btn icon" aria-label="Ajouter 15 secondes" @click="store.addRest(15)">+15</button>
        <button
          v-if="!finished"
          type="button"
          class="btn icon"
          :aria-label="paused ? 'Reprendre le minuteur' : 'Mettre le minuteur en pause'"
          @click="paused ? store.resumeRest() : store.pauseRest()"
        >
          <AppIcon :name="paused ? 'play' : 'pause'" />
        </button>
        <button type="button" class="btn" :class="{ primary: finished }" @click="store.stopRest()">
          {{ finished ? 'OK' : 'Passer' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rest {
  position: fixed;
  /* Au-dessus de la barre de navigation du mode séance (--rest-offset). */
  inset: auto 0 var(--rest-offset, 0px) 0;
  z-index: 30;
  background: var(--surface);
  border-top: 2px solid var(--accent);
  padding-bottom: var(--safe-bottom);
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.25);
}
.rest.finished { border-top-color: var(--ok); background: linear-gradient(0deg, var(--ok-soft), var(--ok-soft)), var(--surface); }
.bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent);
  transform-origin: left;
  transition: transform 0.25s linear;
}
.inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.time-block { display: flex; flex-direction: column; min-width: 0; }
.label { color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 2.2rem; font-weight: 800; line-height: 1; }
.actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
.actions .btn.icon { font-size: 0.85rem; }
</style>
