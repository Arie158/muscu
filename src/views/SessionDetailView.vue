<script setup lang="ts">
import { computed } from 'vue'
import { COOLDOWN_CARDIO, LOWER_MOBILITY, sessionsById, WARMUP } from '@/data/sessions'
import { HOME_DELOAD_NOTE } from '@/data/home'
import type { SessionId } from '@/data/types'
import { useSettingsStore } from '@/stores/settings'
import { useTrackingStore } from '@/stores/tracking'
import PageHeader from '@/components/PageHeader.vue'
import SessionItemList from '@/components/SessionItemList.vue'
import AppIcon from '@/components/AppIcon.vue'
import { sessionBodyMap, sessionBodyParts } from '@/lib/muscles'
import BodyMap from '@/components/BodyMap.vue'

const props = defineProps<{ id: string }>()
const session = computed(() => sessionsById[props.id as SessionId])
const settings = useSettingsStore()
const tracking = useTrackingStore()
const isLower = computed(() => session.value?.id.startsWith('bas'))
const isHome = computed(() => session.value?.location === 'home')
const restToday = computed(() => tracking.data.dailies[settings.today]?.home === 'repos')
const intensity = computed(() => session.value?.fixedRir ?? (settings.week.rir ? `${settings.week.rir.base} sur les bases` : ''))
const bodyParts = computed(() => (session.value ? sessionBodyParts(session.value) : []))
const bodyMap = computed(() => (session.value ? sessionBodyMap(session.value) : { primary: [], secondary: [] }))
const deload = computed(() => settings.week.isDeload && (session.value?.category === 'principale' || isHome.value))
</script>

<template>
  <div v-if="session" class="detail">
    <PageHeader :title="session.name" back="/seances" back-label="Séances">
      <p class="meta">
        <span :class="isHome ? 'home' : 'gym'">{{ isHome ? 'Maison' : 'Salle' }}</span>
        · {{ session.focus }} · {{ session.duration }}
      </p>
      <p v-if="intensity" class="small muted">{{ intensity }}<template v-if="session.optional"> · optionnelle</template></p>
    </PageHeader>

    <p v-if="deload" class="notice small">{{ isHome ? HOME_DELOAD_NOTE : 'Semaine de décharge : séries réduites (déjà appliqué ci-dessous).' }}</p>

    <RouterLink :to="`/seance/${session.id}/go`" class="btn primary lg block">
      <AppIcon name="play" /> Démarrer
    </RouterLink>
    <p v-if="session.optional" class="center">
      <button v-if="!restToday" type="button" class="link" @click="tracking.setHomeDay(settings.today, 'repos')">Repos complet aujourd’hui</button>
      <span v-else class="small muted">Repos complet noté pour aujourd’hui.</span>
    </p>

    <section v-if="bodyParts.length" class="parts" aria-labelledby="parts-title">
      <h2 id="parts-title" class="eyebrow">Parties du corps travaillées</h2>
      <BodyMap :primary="bodyMap.primary" :secondary="bodyMap.secondary" />
      <ul class="list-plain chips">
        <li v-for="p in bodyParts" :key="p.label" class="badge accent">
          {{ p.label }}<span class="count num">{{ p.count > 1 ? ` ×${p.count}` : '' }}</span>
        </li>
      </ul>
    </section>

    <SessionItemList :session="session" />

    <details class="fold">
      <summary>Échauffement, consignes et après la séance</summary>
      <div class="small fold-body">
        <p v-if="(session.warmup ?? WARMUP).length"><strong>Échauffement :</strong> {{ (session.warmup ?? WARMUP).join(' ') }}</p>
        <ul v-if="session.notes?.length">
          <li v-for="n in session.notes" :key="n">{{ n }}</li>
        </ul>
        <p v-if="!isHome"><strong>Après :</strong> {{ COOLDOWN_CARDIO }}<template v-if="isLower"> {{ LOWER_MOBILITY }}</template></p>
        <p v-if="!isHome && settings.week.rir">{{ settings.week.rir.note }}</p>
        <p v-if="isHome">Les variantes suivent le matériel choisi dans les <RouterLink to="/parametres">Paramètres</RouterLink>.</p>
      </div>
    </details>
  </div>
  <div v-else>
    <PageHeader title="Séance introuvable" back="/seances" />
  </div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 1rem; }
.detail :deep(.page-header) { margin-bottom: 0; }
.meta { margin: 0.2rem 0 0; color: var(--muted); }
.meta .gym { color: var(--accent); font-weight: 700; }
.meta .home { color: var(--home); font-weight: 700; }
.notice { border-left: 4px solid var(--warn); padding: 0.35rem 0 0.35rem 0.75rem; margin: 0; }
.center { text-align: center; margin: -0.25rem 0 0; }
.link { background: none; border: 0; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; min-height: 44px; }
.parts h2 { margin: 0 0 0.4rem; }
.chips { margin-top: 0.6rem; justify-content: center; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.chips > li + li { margin-top: 0; }
.count { opacity: 0.75; }
.fold { border-top: 1px solid var(--border); }
.fold > summary { cursor: pointer; min-height: 48px; display: flex; align-items: center; font-weight: 600; color: var(--muted); }
.fold-body p { margin: 0 0 0.5rem; }
</style>
