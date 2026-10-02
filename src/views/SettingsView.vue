<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { profile } from '@/data/profile'
import { equipmentLabels, EQUIPMENT_PREFERENCE } from '@/data/home'
import type { HomeEquipment } from '@/data/types'
import { useSettingsStore } from '@/stores/settings'
import { useBackup } from '@/composables/useBackup'
import { diffDays, isoWeekday } from '@/lib/dates'
import { useStoragePersistence } from '@/composables/useStoragePersistence'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

const store = useSettingsStore()
const { exportData, importData, resetAll } = useBackup()

function toggleEquipment(k: HomeEquipment, on: boolean) {
  const list = store.settings.homeEquipment.filter((e) => e !== k)
  // Ordre de préférence conservé pour un affichage stable.
  store.settings.homeEquipment = EQUIPMENT_PREFERENCE.filter((e) => (e === k ? on : list.includes(e)))
}

const includePhotos = ref(false)
const message = ref<{ tone: 'ok' | 'danger'; text: string } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const persistence = useStoragePersistence()
onMounted(() => void persistence.refresh())
const lastExport = computed(() => store.settings.lastExportAt)
const daysSinceExport = computed(() => (lastExport.value ? diffDays(lastExport.value, store.today) : null))

async function onExport() {
  try {
    const result = await exportData(includePhotos.value)
    if (result === 'annule') return
    message.value = {
      tone: 'ok',
      text: result === 'partage' ? 'Sauvegarde partagée.' : 'Sauvegarde téléchargée (dossier Téléchargements).',
    }
  } catch {
    message.value = { tone: 'danger', text: 'Export impossible.' }
  }
}
async function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!window.confirm('Importer ce fichier ? Les données actuelles de cet appareil seront remplacées.')) {
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  try {
    const data = await importData(await file.text())
    message.value = { tone: 'ok', text: `Import réussi (${data.workouts.length} séances).` }
  } catch (err) {
    message.value = { tone: 'danger', text: err instanceof Error ? err.message : 'Import impossible.' }
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
async function onReset() {
  if (!window.confirm('Tout effacer (séances, poids, mesures, photos, réglages) ? Cette action est irréversible.')) return
  if (!window.confirm('Dernière confirmation : as-tu exporté une sauvegarde ?')) return
  await resetAll()
  message.value = { tone: 'ok', text: 'Toutes les données ont été effacées.' }
}
</script>

<template>
  <div class="stack">
    <PageHeader title="Paramètres" />

    <section class="card stack-sm">
      <h2>Programme</h2>
      <div class="field">
        <label for="start">Date de début <span class="hint">(idéalement un lundi)</span></label>
        <input id="start" v-model="store.settings.startDate" type="date" />
        <span v-if="isoWeekday(store.settings.startDate) !== 1" class="small warn-text">Ce n’est pas un lundi : la semaine type risque d’être décalée.</span>
      </div>
      <div class="grid-2">
        <div class="field">
          <label for="sw">Poids de départ (kg)</label>
          <input id="sw" v-model.number="store.settings.startWeight" type="number" inputmode="decimal" step="0.1" />
        </div>
        <div class="field">
          <label for="gw">Objectif (kg)</label>
          <input id="gw" v-model.number="store.settings.goalWeight" type="number" inputmode="decimal" step="0.1" />
        </div>
      </div>
      <p class="small muted">{{ profile.forecast }}</p>
      <p class="small muted">Les modifications sont enregistrées automatiquement.</p>
    </section>

    <section class="card stack-sm" aria-labelledby="backup-title">
      <h2 id="backup-title">Sauvegarde</h2>
      <p class="status-line">
        <AppIcon :name="daysSinceExport !== null && daysSinceExport < 15 ? 'check' : 'alert'" :size="18" />
        <span v-if="lastExport">Dernière sauvegarde : <strong>{{ daysSinceExport === 0 ? 'aujourd’hui' : `il y a ${daysSinceExport} jour${daysSinceExport! > 1 ? 's' : ''}` }}</strong></span>
        <span v-else><strong>Aucune sauvegarde pour l’instant</strong></span>
      </p>
      <p class="status-line small">
        <AppIcon :name="persistence.status.value === 'protege' ? 'check' : 'info'" :size="18" />
        <span v-if="persistence.status.value === 'protege'">Stockage protégé : le navigateur ne l’effacera pas pour faire de la place.</span>
        <span v-else>
          Stockage non protégé par le navigateur. Installe l’app sur l’écran d’accueil et sauvegarde régulièrement.
          <button v-if="persistence.status.value === 'non-protege'" type="button" class="link" @click="persistence.request()">Redemander</button>
        </span>
      </p>
      <p class="small muted">
        Tes données restent sur ce téléphone. La sauvegarde crée un fichier à ranger dans Fichiers, Drive ou à t’envoyer
        par e-mail ; « Importer » le recharge (ex. sur un nouveau téléphone).
      </p>
      <label class="check"><input v-model="includePhotos" type="checkbox" /> Inclure les photos (fichier plus lourd)</label>
      <button type="button" class="btn primary block" @click="onExport"><AppIcon name="download" /> Sauvegarder maintenant</button>
      <label class="btn block">
        <AppIcon name="upload" /> Importer une sauvegarde
        <input ref="fileInput" type="file" accept="application/json,.json" class="sr-only" @change="onImport" />
      </label>
      <p v-if="message" class="callout" :class="message.tone" role="status">{{ message.text }}</p>
    </section>

    <section class="card stack-sm">
      <fieldset class="equipment">
        <legend><h2>Matériel disponible à la maison</h2></legend>
        <p class="small muted">Le mode séance choisit automatiquement la variante adaptée (modifiable en cours de séance).</p>
        <label v-for="k in EQUIPMENT_PREFERENCE" :key="k" class="check">
          <input
            type="checkbox"
            :checked="store.settings.homeEquipment.includes(k)"
            @change="toggleEquipment(k, ($event.target as HTMLInputElement).checked)"
          />
          <span><strong>{{ equipmentLabels[k].label }}</strong> <span class="small muted">— {{ equipmentLabels[k].detail }}</span></span>
        </label>
        <p v-if="!store.settings.homeEquipment.length" class="small warn-text">Rien de coché : les variantes sans matériel seront proposées.</p>
      </fieldset>
    </section>

    <section class="card stack-sm">
      <h2>Affichage</h2>
      <div class="segmented" role="group" aria-label="Thème">
        <button type="button" :aria-pressed="store.settings.theme === 'dark'" @click="store.settings.theme = 'dark'">Sombre</button>
        <button type="button" :aria-pressed="store.settings.theme === 'light'" @click="store.settings.theme = 'light'">Clair</button>
      </div>
      <label class="check"><input v-model="store.settings.sound" type="checkbox" /> Bip sonore à la fin du repos (en plus de la vibration)</label>
      <label class="check"><input v-model="store.settings.autoAdvance" type="checkbox" /> Passer seul à l’exercice suivant quand toutes ses séries sont validées</label>
    </section>


    <section class="card stack-sm">
      <h2>Réinitialisation</h2>
      <p class="small">Efface toutes les données de l’application sur cet appareil.</p>
      <button type="button" class="btn danger" @click="onReset"><AppIcon name="trash" /> Tout réinitialiser</button>
    </section>
  </div>
</template>

<style scoped>
.check { display: flex; align-items: center; gap: 0.6rem; min-height: var(--tap); }
.warn-text { color: var(--warn); }
label.btn { cursor: pointer; }
.status-line { display: flex; gap: 0.5rem; align-items: flex-start; margin: 0; }
.status-line svg { flex-shrink: 0; margin-top: 3px; color: var(--accent); }
.link { background: none; border: 0; padding: 0; color: var(--accent); font: inherit; font-weight: 600; cursor: pointer; }
.equipment { border: 0; padding: 0; margin: 0; }
.equipment legend { padding: 0; }
.equipment legend h2 { margin: 0 0 0.25rem; }
</style>
