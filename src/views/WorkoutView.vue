<script setup lang="ts">
// Mode séance : orchestre les étapes (échauffement → blocs → bilan) et la navigation.
// Le détail est dans components/workout/* (séries, saisie, échauffement, bilan) et
// WorkoutExercise (miniature, geste, machine occupée, réglages).
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { exercisesById } from '@/data/exercises'
import { COOLDOWN_CARDIO, LOWER_MOBILITY, sessionsById } from '@/data/sessions'
import type { SessionId } from '@/data/types'
import type { WorkoutLog } from '@/lib/models'
import { blockVolume } from '@/lib/workoutRows'
import { defaultRest, useActiveStore } from '@/stores/active'
import { useSettingsStore } from '@/stores/settings'
import { useWakeLock } from '@/composables/useWakeLock'
import AppIcon from '@/components/AppIcon.vue'
import RestTimer from '@/components/RestTimer.vue'
import WorkoutExercise from '@/components/WorkoutExercise.vue'
import ExercisePicker from '@/components/ExercisePicker.vue'
import SetList from '@/components/workout/SetList.vue'
import WarmupStep from '@/components/workout/WarmupStep.vue'
import SummaryStep from '@/components/workout/SummaryStep.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useActiveStore()
const settings = useSettingsStore()
useWakeLock()

const requested = computed(() => sessionsById[props.id as SessionId])
const a = computed(() => store.active)
const conflict = computed(() => !!a.value && a.value.sessionId !== props.id)
const saved = ref<WorkoutLog | null>(null)

if (!store.active && requested.value) store.start(requested.value.id)

const session = computed(() => store.session)
const step = computed(() => a.value?.step ?? 0)
const itemCount = computed(() => a.value?.items.length ?? 0)
/** Index dans la séance du bloc affiché (l'ordre peut changer avec « faire plus tard »). */
const itemIdx = computed(() => store.currentItemIdx)
const item = computed(() => a.value?.items[itemIdx.value])
const sessionItem = computed(() => store.itemDef(itemIdx.value))
const isExtra = computed(() => !!item.value?.extra)
const isSummary = computed(() => step.value === itemCount.value + 1)
const multi = computed(() => (item.value?.exercises.length ?? 0) > 1)
const itemDone = computed(() => item.value?.exercises.every((e) => e.sets.every((s) => s.done)) ?? false)

/** Titre du bloc : pour un exercice seul, son nom réel (alternative comprise). */
const itemTitle = computed(() => {
  const si = sessionItem.value
  const it = item.value
  if (!si || !it) return ''
  return si.format === 'simple' ? (exercisesById[it.exercises[0]!.exerciseId]?.name ?? si.label) : si.label
})
const volume = computed(() => (item.value && sessionItem.value ? blockVolume(sessionItem.value.format, item.value.exercises) : ''))
const formatLabel = { simple: '', superset: 'Superset', circuit: 'Circuit', activite: 'Activité' } as const

// À chaque étape : haut de page et focus sur le titre (lecteurs d'écran, clavier).
watch(step, async () => {
  window.scrollTo({ top: 0 })
  await nextTick()
  document.querySelector<HTMLElement>('main h1')?.focus()
})

// ── Notification discrète ──
const toast = ref('')
let toastTimer: number | undefined
function notify(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2600)
}

/** Bloc terminé : on passe à l'exercice suivant pendant le repos (le minuteur continue en bas). */
function onItemFinished() {
  if (!settings.settings.autoAdvance) return
  const from = step.value
  notify(from === itemCount.value ? 'Dernier exercice terminé ✓' : 'Exercice terminé ✓')
  window.setTimeout(() => {
    if (step.value === from) store.goTo(from + 1)
  }, 1100)
}
function postpone() {
  if (store.postpone()) {
    window.scrollTo({ top: 0 })
    notify('Déplacé en fin de séance')
  }
}

// ── Exercice non prévu ──
const adding = ref(false)
function addExercise(id: string) {
  adding.value = false
  const target = store.addExtra(id)
  if (target === null) return
  store.goTo(target)
  notify(`${exercisesById[id]?.name ?? 'Exercice'} ajouté`)
}
function removeExtra() {
  const it = item.value
  if (!it) return
  const started = it.exercises.some((e) => e.sets.some((s) => s.done))
  if (started && !window.confirm('Retirer cet exercice ajouté ? Ses séries validées ne seront pas enregistrées.')) return
  if (store.removeExtra(itemIdx.value)) notify('Exercice retiré')
}

function switchSession() {
  if (!requested.value) return
  if (window.confirm(`Abandonner la séance « ${session.value?.name} » en cours (rien ne sera enregistré) et démarrer « ${requested.value.name} » ?`)) {
    store.abandon()
    store.start(requested.value.id)
  }
}
function abandon() {
  if (window.confirm('Abandonner la séance ? Les séries saisies ne seront pas enregistrées.')) {
    store.abandon()
    void router.push('/')
  }
}
function finish() {
  saved.value = store.finish()
}
</script>

<template>
  <div class="workout" :class="{ 'with-bar': !!item && !saved && !conflict }">
    <!-- Séance enregistrée -->
    <section v-if="saved" class="stack">
      <h1 tabindex="-1">Séance enregistrée 💪</h1>
      <p>{{ sessionsById[saved.sessionId].name }} — {{ saved.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) }} séries.</p>
      <p v-if="(saved.location ?? 'gym') === 'gym'" class="muted">
        {{ COOLDOWN_CARDIO }}<template v-if="saved.sessionId.startsWith('bas')"> {{ LOWER_MOBILITY }}</template>
      </p>
      <p v-else class="muted">Séance maison cochée dans ton suivi du jour.</p>
      <RouterLink to="/" class="btn primary lg block">Retour à l’accueil</RouterLink>
    </section>

    <!-- Autre séance en cours -->
    <section v-else-if="conflict" class="stack">
      <h1 tabindex="-1">Une séance est déjà en cours</h1>
      <p>« {{ session?.name }} » n’est pas terminée ({{ store.doneSets }} / {{ store.totalSets }} séries).</p>
      <RouterLink :to="`/seance/${a!.sessionId}/go`" class="btn primary lg block">Reprendre {{ session?.name }}</RouterLink>
      <button type="button" class="btn danger block" @click="switchSession">Abandonner et démarrer {{ requested?.name }}</button>
    </section>

    <template v-else-if="a && session">
      <header class="topbar">
        <RouterLink to="/" class="btn ghost icon" aria-label="Quitter le mode séance (la séance reste en cours)">
          <AppIcon name="close" />
        </RouterLink>
        <div class="title">
          <strong>{{ session.name }}</strong>
          <span class="small muted num">{{ store.doneSets }} / {{ store.totalSets }} séries</span>
        </div>
        <span class="badge num">{{ Math.min(Math.max(step, 0), itemCount) }}/{{ itemCount }}</span>
        <div class="progress" aria-hidden="true">
          <div :style="{ transform: `scaleX(${store.totalSets ? store.doneSets / store.totalSets : 0})` }" />
        </div>
      </header>

      <WarmupStep v-if="step === 0" :session="session" :active="a" />

      <!-- Bloc en cours -->
      <section v-else-if="item && sessionItem" class="stack">
        <header>
          <p class="eyebrow">{{ step }} / {{ itemCount }}<template v-if="sessionItem.format !== 'simple'"> · {{ formatLabel[sessionItem.format] }}</template><template v-if="isExtra"> · Ajouté hors programme</template></p>
          <h1 tabindex="-1" class="item-title">{{ itemTitle }}</h1>
          <p class="muted small num">{{ volume }}<template v-if="sessionItem.rest.max > 0"> · repos {{ sessionItem.restLabel }}</template></p>
          <p v-if="sessionItem.cue" class="cue small">{{ sessionItem.cue }}</p>
        </header>

        <p v-if="item.exercises.some((e) => e.equipment === 'band')" class="safety small" role="note">
          <AppIcon name="alert" :size="16" /> Élastique : teste l’ancrage et vérifie l’usure avant chaque série.
        </p>

        <div class="exercises">
          <WorkoutExercise
            v-for="(ex, j) in item.exercises"
            :key="j"
            :ex="ex"
            :item-idx="itemIdx"
            :ex-idx="j"
            :show-name="multi || sessionItem.format !== 'simple'"
            :cue="sessionItem.cue || undefined"
            :can-postpone="step < itemCount && !itemDone"
            @notify="notify"
            @postpone="postpone"
          />
        </div>

        <SetList :item="item" :item-idx="itemIdx" :format="sessionItem.format" @finished="onItemFinished" />

        <details class="options">
          <summary>Options</summary>
          <div class="row">
            <template v-if="sessionItem.format !== 'activite'">
              <button type="button" class="btn" @click="store.addSet(itemIdx)"><AppIcon name="plus" /> {{ sessionItem.format === 'circuit' ? 'Tour' : 'Série' }}</button>
              <button type="button" class="btn" @click="store.removeSet(itemIdx)"><AppIcon name="minus" /> {{ sessionItem.format === 'circuit' ? 'Tour' : 'Série' }}</button>
            </template>
            <button v-if="sessionItem.rest.max > 0" type="button" class="btn" @click="store.startRest(defaultRest(sessionItem))">
              <AppIcon name="timer" /> Repos
            </button>
            <button type="button" class="btn" @click="adding = true"><AppIcon name="plus" /> Exercice non prévu</button>
            <button v-if="isExtra" type="button" class="btn danger-text" @click="removeExtra"><AppIcon name="trash" /> Retirer cet exercice</button>
          </div>
        </details>
      </section>

      <SummaryStep v-else-if="isSummary" :session="session" :active="a" @finish="finish" @abandon="abandon" @add="adding = true" />

      <!-- Barre de navigation fixe -->
      <nav v-if="item" class="workout-bar" aria-label="Navigation entre exercices">
        <button type="button" class="btn icon" aria-label="Exercice précédent" @click="store.goTo(step - 1)"><AppIcon name="left" /></button>
        <button type="button" class="btn primary grow" @click="store.goTo(step + 1)">
          {{ step === itemCount ? 'Bilan' : 'Exercice suivant' }} <AppIcon name="right" />
        </button>
      </nav>

      <ExercisePicker :open="adding" @close="adding = false" @pick="addExercise" />
      <RestTimer />
      <p class="toast" :class="{ show: !!toast }" role="status" aria-live="polite">{{ toast }}</p>
    </template>

    <section v-else class="stack">
      <h1>Séance introuvable</h1>
      <RouterLink to="/seances" class="btn">Voir les séances</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.workout.with-bar { --rest-offset: calc(68px + var(--safe-bottom)); }
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: -1rem -1rem 1rem;
  padding: 0.4rem 1rem;
  background: var(--bg);
}
.title { flex: 1; display: flex; flex-direction: column; line-height: 1.2; }
.progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--border); }
.progress div { height: 100%; background: var(--accent); transform-origin: left; transition: transform 0.3s ease; }
:deep(h1:focus) { outline: none; }
.item-title { font-size: 1.4rem; margin-bottom: 0.2rem; }
header p { margin: 0; }
.cue { margin-top: 0.35rem !important; color: var(--muted); }
.safety { display: flex; gap: 0.4rem; align-items: center; color: var(--warn); margin: 0; }
.exercises { display: flex; flex-direction: column; gap: 0.9rem; }
.exercises > * + * { padding-top: 0.9rem; border-top: 1px solid var(--border); }
.danger-text { color: var(--danger); }
.options > summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; color: var(--muted); font-weight: 600; }
.workout-bar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 25;
  display: flex;
  gap: 0.5rem;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem calc(0.5rem + var(--safe-bottom));
  background: var(--bg);
  border-top: 1px solid var(--border);
}
.workout-bar .grow { flex: 1; }
.toast {
  position: fixed;
  left: 50%;
  top: 4.25rem;
  z-index: 40;
  max-width: calc(100% - 2rem);
  margin: 0;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: var(--text);
  color: var(--bg);
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
  transform: translate(-50%, -8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.toast.show { opacity: 1; transform: translate(-50%, 0); }
</style>
