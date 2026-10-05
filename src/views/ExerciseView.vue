<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { exercisesById } from '@/data/exercises'
import { sessions } from '@/data/sessions'
import type { StartingReference } from '@/data/types'
import { formatShort } from '@/lib/dates'
import { useWorkoutsStore } from '@/stores/workouts'
import PageHeader from '@/components/PageHeader.vue'
import ExerciseIllustration from '@/components/ExerciseIllustration.vue'
import ExerciseThumb from '@/components/ExerciseThumb.vue'
import { alternativeOf, alternativesFor } from '@/lib/alternatives'
import { bandSafety, equipmentLabels, EQUIPMENT_PREFERENCE, homeProgressionSteps } from '@/data/home'
import { formatTarget } from '@/lib/format'
import { pickVariant } from '@/lib/home'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from '@/components/AppIcon.vue'
import BodyMap from '@/components/BodyMap.vue'
import { exerciseBodyParts } from '@/lib/muscles'

const props = defineProps<{ id: string }>()
const exercise = computed(() => exercisesById[props.id])
const parts = computed(() => (exercise.value ? exerciseBodyParts(exercise.value) : { primary: [], secondary: [] }))
const isHome = computed(() => exercise.value?.location === 'home')
const alts = computed(() => alternativesFor(props.id))
const altOf = computed(() => alternativeOf(props.id))
const variantList = computed(() =>
  EQUIPMENT_PREFERENCE.flatMap((k) => {
    const v = exercise.value?.variants?.[k]
    return v ? [{ key: k, ...v }] : []
  }),
)
const hasBand = computed(() => variantList.value.some((v) => v.key === 'band'))
// Illustrations de variantes montées seulement à l'ouverture (performance).
const openIllus = reactive<Record<string, boolean>>({})
const settingsStore = useSettingsStore()
/** Variante correspondant au matériel choisi : seule celle-ci est dépliée. */
const preferred = computed(() => (exercise.value ? pickVariant(exercise.value, settingsStore.settings.homeEquipment) : null))
const workouts = useWorkoutsStore()

const usages = computed(() =>
  sessions.flatMap((s) =>
    s.items
      .filter((i) => i.exercises.some((x) => x.exerciseId === props.id))
      .map((i) => ({ session: s, item: i, target: i.exercises.find((x) => x.exerciseId === props.id)!.target })),
  ),
)
const keyCues = computed(() => [...new Set(usages.value.filter((u) => u.session.category !== 'imprevu').map((u) => u.item.cue))])
const history = computed(() => [...workouts.historyFor(props.id)].reverse().slice(0, 8))
const loadUnit = computed(() => (exercise.value?.loadType === 'assistance' ? 'kg d’assistance' : 'kg'))

// Édition des charges de référence (machines)
const refs = ref<StartingReference[]>([])
watch(
  () => [props.id, workouts.references[props.id]],
  () => (refs.value = (workouts.references[props.id] ?? []).map((r) => ({ ...r }))),
  { immediate: true, deep: true },
)
const saved = ref(false)
function saveRefs() {
  workouts.setReferences(
    props.id,
    refs.value.filter((r) => r.machine.trim() && Number.isFinite(r.load)).map((r) => ({ machine: r.machine.trim(), load: Number(r.load) })),
  )
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2000)
}

const setsSummary = (sets: { load: number | null; reps: number | null; rir: number | null; done: boolean }[]) =>
  sets
    .filter((s) => s.done)
    .map((s) => `${s.load !== null ? `${s.load} kg × ` : ''}${s.reps ?? '?'}${s.rir !== null ? ` @${s.rir}` : ''}`)
    .join(' · ')
</script>

<template>
  <div v-if="exercise" class="stack">
    <PageHeader :title="exercise.name" back="/exercices" back-label="Exercices" />

    <ExerciseIllustration :exercise="exercise" />

    <section class="card">
      <BodyMap :primary="parts.primary.map((p) => p.label)" :secondary="parts.secondary.map((p) => p.label)" class="map" />
      <dl class="facts">
        <div><dt>Muscles principaux</dt><dd>{{ exercise.primaryMuscles.join(', ') }}</dd></div>
        <div v-if="exercise.secondaryMuscles.length"><dt>Muscles secondaires</dt><dd>{{ exercise.secondaryMuscles.join(', ') }}</dd></div>
        <div><dt>Matériel</dt><dd>{{ exercise.equipment }}</dd></div>
      </dl>
      <p v-if="exercise.noFailure" class="badge warn" style="margin-top: 0.5rem">
        <AppIcon name="alert" :size="16" /> Jamais d’échec total sur ce mouvement
      </p>
    </section>

    <section v-if="usages.length" class="card">
      <h2>Dans le programme</h2>
      <ul class="list-plain">
        <li v-for="u in usages" :key="u.item.id">
          <RouterLink :to="`/seances/${u.session.id}`">{{ u.session.name }}</RouterLink> :
          <span class="num">{{ u.item.format === 'activite' ? '' : `${u.item.format === 'circuit' ? `${u.item.sets} tour${u.item.sets > 1 ? 's' : ''}` : u.item.sets} × ` }}{{ formatTarget(u.target, u.item.exercises.find((x) => x.exerciseId === id)?.perSide) }}</span><template v-if="u.item.rest.max > 0">,
          repos {{ u.item.restLabel }}</template>
        </li>
      </ul>
    </section>

    <section v-if="alts.length" class="card" aria-labelledby="alts-title">
      <h2 id="alts-title">Si la machine est occupée</h2>
      <ul class="list-plain alt-list">
        <li v-for="a in alts" :key="a.id">
          <RouterLink :to="`/exercices/${a.id}`" class="alt">
            <ExerciseThumb :exercise="a" size="sm" :animate="false" :interactive="false" />
            <span>{{ a.name }}</span>
          </RouterLink>
        </li>
      </ul>
      <p class="small muted">En séance : bouton « Machine occupée ? ». Chaque alternative garde son propre historique de charges.</p>
    </section>
    <section v-if="altOf.length" class="card">
      <h2>Alternative à</h2>
      <p>
        <template v-for="(p, i) in altOf" :key="p.id">
          <RouterLink :to="`/exercices/${p.id}`">{{ p.name }}</RouterLink><template v-if="i < altOf.length - 1">, </template>
        </template>
      </p>
    </section>

    <section class="card">
      <h2>Consignes techniques</h2>
      <p v-for="c in keyCues" :key="c" class="callout"><strong>Consigne clé :</strong> {{ c }}</p>
      <ul>
        <li v-for="t in exercise.technique" :key="t">{{ t }}</li>
      </ul>
    </section>

    <section class="card">
      <h2>Erreurs fréquentes</h2>
      <ul>
        <li v-for="m in exercise.mistakes" :key="m">{{ m }}</li>
      </ul>
    </section>

    <section v-if="variantList.length" class="stack-sm" aria-labelledby="variants-title">
      <h2 id="variants-title">Variantes selon le matériel</h2>
      <div v-if="hasBand" class="callout warn" role="note">
        <p><strong>Sécurité élastique</strong></p>
        <ul>
          <li v-for="s in bandSafety" :key="s">{{ s }}</li>
        </ul>
      </div>
      <details v-for="v in variantList" :key="v.key" class="card variant" :open="v.key === preferred">
        <summary>
          <span class="eyebrow">{{ equipmentLabels[v.key].label }}<template v-if="v.key === preferred"> · ton matériel</template></span>
          <span class="variant-title">{{ v.label }}</span>
        </summary>
        <div class="stack-sm variant-body">
        <p v-if="v.target" class="small"><strong>Cible :</strong> {{ formatTarget(v.target) }}</p>
        <p v-if="v.perSide" class="small"><strong>Par {{ v.perSide }}</strong></p>
        <ul class="small">
          <li v-for="i in v.instructions" :key="i">{{ i }}</li>
        </ul>
        <ol class="ladder small" aria-label="Progression dans cette variante">
          <li><span class="badge">Plus facile</span> {{ v.easier }}</li>
          <li><span class="badge accent">Actuelle</span> {{ v.current }}</li>
          <li><span class="badge ok">Plus difficile</span> {{ v.harder }}</li>
        </ol>
        <p class="small muted">Charge : {{ v.load === 'niveau' ? 'niveau libre (pas de kilos)' : 'aucune' }}</p>
        <details v-if="v.illustration" class="illus-toggle" @toggle="openIllus[v.key] = ($event.target as HTMLDetailsElement).open">
          <summary>Illustration de cette variante</summary>
          <ExerciseIllustration v-if="openIllus[v.key]" :exercise="exercise" :illustration="v.illustration" :video-query="v.videoQuery" />
        </details>
        </div>
      </details>
      <div class="card">
        <h3>Progression maison</h3>
        <ol class="small">
          <li v-for="s in homeProgressionSteps" :key="s.step"><strong>{{ s.title }}</strong> — {{ s.detail }}</li>
        </ol>
        <p class="small muted">Toujours à RIR 3. Avec de vrais haltères, la double progression de la salle s’applique.</p>
      </div>
    </section>

    <section class="grid-auto">
      <div class="card">
        <h3>Variante plus facile</h3>
        <p>{{ exercise.easier }}</p>
      </div>
      <div class="card">
        <h3>Variante plus difficile</h3>
        <p>{{ exercise.harder }}</p>
      </div>
    </section>

    <section class="card">
      <h2>Dernières performances</h2>
      <ul v-if="history.length" class="list-plain">
        <li v-for="(h, i) in history" :key="i">
          <span class="small muted">
            {{ formatShort(h.date) }}{{ h.machine ? ` · ${h.machine}` : '' }}
            <template v-if="isHome && h.equipment"> · {{ equipmentLabels[h.equipment].label }}{{ h.dumbbells ? ' (haltères)' : '' }}</template>
            {{ h.level ? ` · ${h.level}` : '' }}{{ h.tempo && h.tempo !== 'normal' ? ` · tempo ${h.tempo}` : '' }}
          </span><br />
          <span class="num">{{ setsSummary(h.sets) }}</span>
        </li>
      </ul>
      <p v-else class="muted">Aucune séance enregistrée pour cet exercice.</p>
    </section>

    <section v-if="exercise.loadType !== 'duree' && exercise.loadType !== 'poids-du-corps'" class="card stack-sm">
      <h2>Charges de référence</h2>
      <p class="small muted">
        Pré-remplies comme « dernière performance » tant qu’aucune séance n’est enregistrée.
        Nomme chaque machine pour distinguer deux appareils différents ({{ loadUnit }}).
      </p>
      <div v-for="(r, i) in refs" :key="i" class="ref-row">
        <input v-model="r.machine" type="text" :aria-label="`Nom de la machine ${i + 1}`" placeholder="Machine" />
        <input v-model.number="r.load" type="number" inputmode="decimal" step="0.5" :aria-label="`Charge machine ${i + 1} (${loadUnit})`" />
        <button type="button" class="btn icon" :aria-label="`Supprimer la machine ${i + 1}`" @click="refs.splice(i, 1)">
          <AppIcon name="trash" />
        </button>
      </div>
      <div class="row">
        <button type="button" class="btn" @click="refs.push({ machine: '', load: 0 })"><AppIcon name="plus" /> Ajouter une machine</button>
        <button type="button" class="btn primary" @click="saveRefs">Enregistrer</button>
        <span v-if="saved" class="badge ok" role="status">Enregistré</span>
      </div>
    </section>
  </div>
  <div v-else>
    <PageHeader title="Exercice introuvable" back="/exercices" />
  </div>
</template>

<style scoped>
.map { margin-bottom: 0.75rem; }
.facts { margin: 0; display: grid; gap: 0.6rem; }
.facts dt { font-size: 0.82rem; color: var(--muted); font-weight: 600; }
.facts dd { margin: 0; font-weight: 600; }
.variant > summary { cursor: pointer; list-style: none; display: flex; flex-direction: column; min-height: 44px; }
.variant > summary::-webkit-details-marker { display: none; }
.variant > summary::after { content: 'Afficher'; color: var(--accent); font-weight: 600; font-size: 0.9rem; margin-top: 0.25rem; }
.variant[open] > summary::after { content: 'Masquer'; }
.variant-title { font-weight: 700; font-size: 1.05rem; }
.variant-body { margin-top: 0.75rem; }
.alt-list { display: flex; flex-direction: column; gap: 0.35rem; }
.alt-list > li + li { margin-top: 0; }
.alt { display: flex; align-items: center; gap: 0.75rem; min-height: 44px; font-weight: 600; text-decoration: none; color: var(--text); }
.alt:hover span { color: var(--accent); text-decoration: underline; }
.ladder { padding-left: 0; list-style: none; }
.ladder li { display: flex; gap: 0.5rem; align-items: baseline; }
.illus-toggle summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; color: var(--accent); font-weight: 600; }
.callout ul { margin: 0.25rem 0 0; }
.ref-row { display: grid; grid-template-columns: 1fr 6rem var(--tap); gap: 0.4rem; }
.grid-auto > .card + .card { margin-top: 0.75rem; }
@media (min-width: 560px) { .grid-auto > .card + .card { margin-top: 0; } }
.callout { margin-bottom: 0.75rem; }
</style>
