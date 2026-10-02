<script setup lang="ts">
// Accueil volontairement minimal : la séance du jour, la semaine en un coup d'œil, la pesée du matin,
// et au plus un message important. Tout le reste est dans Suivi, Séances et Plus.
import { computed, ref } from 'vue'
import { weekTemplate } from '@/data/week'
import { sessionsById } from '@/data/sessions'
import { PROGRAM_WEEKS } from '@/data/plan'
import { addDays, formatFull, formatLong, isoWeekday, mondayOf } from '@/lib/dates'
import { dayPlan } from '@/lib/week'
import { round1 } from '@/lib/weight'
import { useSettingsStore } from '@/stores/settings'
import { useTrackingStore } from '@/stores/tracking'
import { useWorkoutsStore } from '@/stores/workouts'
import { useActiveStore } from '@/stores/active'
import { useInsights } from '@/composables/useInsights'
import { useBackup } from '@/composables/useBackup'
import { EXPORT_SNOOZE_DAYS, exportReminder } from '@/lib/backup'
import AppIcon from '@/components/AppIcon.vue'

const settings = useSettingsStore()
const tracking = useTrackingStore()
const workouts = useWorkoutsStore()
const active = useActiveStore()
const { avg7, recovery, matchedCriteria, training } = useInsights()

const today = computed(() => settings.today)
const week = computed(() => settings.week)
const todayIdx = computed(() => isoWeekday(today.value))
const plan = computed(() => dayPlan(today.value))
const session = computed(() => sessionsById[plan.value.sessionId])
const isHome = computed(() => session.value.location === 'home')
const monday = computed(() => mondayOf(today.value))
const homeFlag = (date: string) => tracking.data.dailies[date]?.home

const weekLogs = computed(() => workouts.logs.filter((l) => l.date >= monday.value && l.date <= addDays(monday.value, 6)))
function dayStatus(weekday: number): 'fait' | 'repos' | null {
  const date = addDays(monday.value, weekday - 1)
  const d = weekTemplate.find((x) => x.weekday === weekday)!
  if (homeFlag(date) === 'repos') return 'repos'
  if (d.location === 'home') return homeFlag(date) === 'faite' || weekLogs.value.some((l) => l.date === date && l.location === 'home') ? 'fait' : null
  return weekLogs.value.some((l) => l.date === date && (l.location ?? 'gym') === 'gym') ? 'fait' : null
}
const todayStatus = computed(() => dayStatus(todayIdx.value))

function toRest() {
  if (active.active?.sessionId === session.value.id) active.abandon()
  tracking.setHomeDay(today.value, 'repos')
}

const meta = computed(() => {
  const w = week.value
  if (w.status === 'avant') return `Début le ${formatFull(settings.settings.startDate)}`
  if (w.status === 'termine') return 'Programme terminé : place au bilan'
  return [`Semaine ${w.week}/${PROGRAM_WEEKS}`, w.block?.name, w.rir?.base].filter(Boolean).join(' · ')
})

// ── Un seul message, le plus important ──
interface Notice {
  text: string
  to?: string
  link?: string
  tone: 'info' | 'warn'
  /** Action directe (ex. sauvegarder) et option « Plus tard ». */
  action?: { label: string; run: () => void | Promise<unknown> }
  dismiss?: () => void
}

// ── Rappel de sauvegarde (données uniquement sur ce téléphone) ──
const { exportData } = useBackup()
const reminder = computed(() =>
  exportReminder({
    today: today.value,
    lastExportAt: settings.settings.lastExportAt,
    snoozeUntil: settings.settings.exportSnoozeUntil,
    dataCount: workouts.logs.length + Object.keys(tracking.data.dailies).length,
  }),
)
const saving = ref(false)
async function saveNow() {
  saving.value = true
  try {
    await exportData(false)
  } finally {
    saving.value = false
  }
}
function snooze() {
  settings.settings.exportSnoozeUntil = addDays(today.value, EXPORT_SNOOZE_DAYS - 1)
}
const notices = computed<Notice[]>(() => {
  const out: Notice[] = []
  const next = sessionsById[workouts.nextInOrder]
  if (!isHome.value && workouts.logs.length && next.id !== session.value.id && todayStatus.value !== 'fait') {
    out.push({ tone: 'info', text: `Séance manquée ? Dans l’ordre, la prochaine est ${next.name}.`, to: `/seance/${next.id}/go`, link: `Faire ${next.name}` })
  }
  if (reminder.value.due) {
    out.push({
      tone: 'warn',
      text: reminder.value.daysSince === null
        ? 'Tes données ne sont que sur ce téléphone : fais une première sauvegarde.'
        : `Dernière sauvegarde il y a ${reminder.value.daysSince} jours.`,
      action: { label: 'Sauvegarder', run: saveNow },
      dismiss: snooze,
    })
  }
  if (week.value.isDeload) out.push({ tone: 'warn', text: 'Semaine de décharge : séries réduites automatiquement.' })
  if (settings.resumeActive) out.push({ tone: 'warn', text: 'Mode reprise : charges −10 % et 1 série de moins.' })
  if (recovery.value.signals.length) out.push({ tone: 'warn', text: 'Récupération à surveiller : allège d’abord les séances maison.', to: '/imprevus', link: 'Que faire ?' })
  const adjust = matchedCriteria.value.find((c) => c.tone === 'ajuster')
  if (adjust) out.push({ tone: 'warn', text: `Ajustement suggéré : ${adjust.action}.`, to: '/alimentation', link: 'Détails' })
  if (training.value.alert) out.push({ tone: 'warn', text: 'Stagnation sur la plupart des exercices : envisage d’avancer la décharge.', to: '/progression', link: 'Détails' })
  return out
})

// ── Pesée du matin ──
const todayWeight = computed(() => tracking.data.dailies[today.value]?.weight)
const editing = ref(false)
const weightInput = ref<number | null>(null)
function saveWeight() {
  if (!weightInput.value || weightInput.value < 30) return
  tracking.setDaily(today.value, { weight: weightInput.value })
  weightInput.value = null
  editing.value = false
}
const fmt = (n: number) => round1(n).toLocaleString('fr-FR')
</script>

<template>
  <div class="home">
    <header class="hello">
      <p class="date">{{ formatLong(today) }}</p>
      <p class="meta">{{ meta }}</p>
    </header>

    <!-- Séance du jour : l'action principale -->
    <section class="today" :class="{ home: isHome && !active.active }" aria-labelledby="today-title">
      <template v-if="active.active">
        <p class="eyebrow">Séance en cours</p>
        <h1 id="today-title">{{ active.session?.name }}</h1>
        <p class="sub">{{ active.doneSets }} / {{ active.totalSets }} séries faites</p>
        <RouterLink :to="`/seance/${active.active.sessionId}/go`" class="btn primary lg block">
          <AppIcon name="play" /> Reprendre
        </RouterLink>
      </template>
      <template v-else>
        <p class="eyebrow">{{ isHome ? 'Maison' : 'Salle' }} · aujourd’hui</p>
        <h1 id="today-title">{{ session.name }}</h1>
        <p class="sub">{{ session.focus }} · {{ session.duration }}</p>
        <p v-if="todayStatus === 'fait'" class="status ok"><AppIcon name="check" :size="18" /> Faite aujourd’hui. Bien joué !</p>
        <p v-else-if="todayStatus === 'repos'" class="status">Repos complet aujourd’hui.</p>
        <RouterLink v-else :to="`/seance/${session.id}/go`" class="btn primary lg block">
          <AppIcon name="play" /> Démarrer
        </RouterLink>
        <div class="secondary">
          <RouterLink :to="`/seances/${session.id}`">Voir le détail</RouterLink>
          <button v-if="session.optional && !todayStatus" type="button" class="link" @click="toRest">Repos complet aujourd’hui</button>
          <button v-if="todayStatus === 'repos'" type="button" class="link" @click="tracking.setHomeDay(today, null)">Annuler le repos</button>
        </div>
      </template>
    </section>

    <!-- Un seul message à la fois -->
    <div v-if="notices.length" class="notice" :class="notices[0]!.tone" role="status">
      <p>
        {{ notices[0]!.text }}
        <RouterLink v-if="notices[0]!.to" :to="notices[0]!.to">{{ notices[0]!.link }}</RouterLink>
      </p>
      <div v-if="notices[0]!.action" class="notice-actions">
        <button type="button" class="btn primary" :disabled="saving" @click="notices[0]!.action!.run()">
          <AppIcon name="download" :size="18" /> {{ saving ? '…' : notices[0]!.action!.label }}
        </button>
        <button v-if="notices[0]!.dismiss" type="button" class="link" @click="notices[0]!.dismiss!()">Plus tard</button>
      </div>
      <p v-if="notices.length > 1" class="small muted">
        + {{ notices.length - 1 }} autre{{ notices.length > 2 ? 's' : '' }} point{{ notices.length > 2 ? 's' : '' }} dans
        <RouterLink to="/suivi">Suivi</RouterLink>
      </p>
    </div>

    <!-- La semaine en un coup d'œil -->
    <section aria-labelledby="week-title">
      <div class="section-head">
        <h2 id="week-title">Cette semaine</h2>
        <RouterLink to="/seances" class="small">Toutes les séances</RouterLink>
      </div>
      <ol class="strip list-plain">
        <li v-for="d in weekTemplate" :key="d.weekday">
          <RouterLink
            :to="`/seances/${d.sessionId}`"
            class="day"
            :class="[dayStatus(d.weekday) ?? '', { today: d.weekday === todayIdx, home: d.location === 'home' }]"
            :aria-label="`${d.label} : ${d.title}, ${d.location === 'gym' ? 'salle' : 'maison'}${dayStatus(d.weekday) === 'fait' ? ', faite' : dayStatus(d.weekday) === 'repos' ? ', repos' : ''}`"
            :aria-current="d.weekday === todayIdx ? 'date' : undefined"
          >
            <span class="letter" aria-hidden="true">{{ d.label.slice(0, 1) }}</span>
            <span class="mark" aria-hidden="true">
              <AppIcon v-if="dayStatus(d.weekday) === 'fait'" name="check" :size="16" />
              <AppIcon v-else :name="d.location === 'gym' ? 'dumbbell' : 'home'" :size="16" />
            </span>
            <span class="short" aria-hidden="true">{{ d.title.replace('Maison ', 'M') }}</span>
          </RouterLink>
        </li>
      </ol>
      <p class="legend small muted"><AppIcon name="dumbbell" :size="14" /> salle · <AppIcon name="home" :size="14" /> maison</p>
    </section>

    <!-- Pesée du matin -->
    <section aria-labelledby="weight-title">
      <div class="section-head">
        <h2 id="weight-title">Pesée du matin</h2>
        <RouterLink to="/suivi" class="small">Suivi complet</RouterLink>
      </div>
      <div class="weigh">
        <template v-if="todayWeight && !editing">
          <p class="weight-now"><span class="big num">{{ fmt(todayWeight) }}</span> kg</p>
          <button type="button" class="link" @click="editing = true">Modifier</button>
        </template>
        <form v-else class="weigh-form" @submit.prevent="saveWeight">
          <label for="w-today" class="sr-only">Poids ce matin (kg)</label>
          <input id="w-today" v-model.number="weightInput" type="number" inputmode="decimal" step="0.1" min="30" max="300" :placeholder="todayWeight ? fmt(todayWeight) : 'kg, à jeun'" />
          <button type="submit" class="btn primary">Enregistrer</button>
        </form>
        <p class="small muted avg">Moyenne 7 jours : <strong class="num">{{ avg7 === null ? '—' : `${fmt(avg7)} kg` }}</strong> · objectif {{ settings.settings.goalWeight }} kg</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home { display: flex; flex-direction: column; gap: 1.5rem; }
.hello .date { font-size: 1.05rem; font-weight: 700; margin: 0; }
.hello .date::first-letter { text-transform: uppercase; }
.hello .meta { color: var(--muted); margin: 0; font-size: 0.9rem; }

.today {
  padding: 1.25rem;
  border-radius: 20px;
  background: linear-gradient(160deg, var(--accent-soft), transparent 75%), var(--surface);
  border: 1px solid var(--accent);
}
.today.home { background: linear-gradient(160deg, var(--home-soft), transparent 75%), var(--surface); border-color: var(--home); }
.today h1 { font-size: 2rem; margin: 0.1rem 0 0.2rem; }
.today .sub { color: var(--muted); margin: 0 0 1rem; }
.status { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; margin: 0; }
.status.ok { color: var(--ok); }
.secondary { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; margin-top: 0.75rem; }
.secondary a, .link {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
}
.link { background: none; border: 0; padding: 0; color: var(--accent); font-family: inherit; cursor: pointer; }

.notice { border-left: 4px solid var(--accent); padding: 0.5rem 0 0.5rem 0.85rem; }
.notice.warn { border-color: var(--warn); }
.notice p { margin: 0; }
.notice p + p { margin-top: 0.25rem; }
.notice-actions { display: flex; align-items: center; gap: 1rem; margin-top: 0.6rem; }

.section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.6rem; }
.section-head h2 { font-size: 1.05rem; margin: 0; }

.strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.35rem; }
.strip li + li { margin-top: 0; }
.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0 0.45rem;
  min-height: 76px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
  text-decoration: none;
}
.day .letter { font-weight: 800; font-size: 0.85rem; color: var(--text); }
.day .short { font-size: 0.7rem; font-weight: 600; white-space: nowrap; }
.day.home .mark { color: var(--home); }
.day.fait { background: var(--ok-soft); border-color: transparent; }
.day.fait .mark { color: var(--ok); }
.day.repos { border-style: dashed; }
.day.today { border: 2px solid var(--accent); }
.legend { display: flex; align-items: center; gap: 0.3rem; margin: 0.5rem 0 0; }

.weigh { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; }
.weight-now { margin: 0; color: var(--muted); }
.weight-now .big { font-size: 2.2rem; font-weight: 800; color: var(--text); }
.weigh-form { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.avg { margin: 0.6rem 0 0; }
</style>
