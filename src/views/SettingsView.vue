<script setup lang="ts">
import { ref } from 'vue'
import { profile } from '@/data/profile'
import { equipmentLabels, EQUIPMENT_PREFERENCE } from '@/data/home'
import type { HomeEquipment } from '@/data/types'
import { useSettingsStore } from '@/stores/settings'
import { useBackup } from '@/composables/useBackup'
import { isoWeekday } from '@/lib/dates'
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

async function onExport() {
  try {
    await exportData(includePhotos.value)
    message.value = { tone: 'ok', text: 'Sauvegarde téléchargée.' }
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
      <h2>Sauvegarde</h2>
      <p class="small">
        Tes données ne quittent jamais cet appareil. Exporte régulièrement un fichier JSON pour les sauvegarder
        ou les transférer sur un autre téléphone (Importer).
      </p>
      <label class="check"><input v-model="includePhotos" type="checkbox" /> Inclure les photos (fichier plus lourd)</label>
      <div class="row">
        <button type="button" class="btn primary" @click="onExport"><AppIcon name="download" /> Exporter (JSON)</button>
        <label class="btn">
          <AppIcon name="upload" /> Importer
          <input ref="fileInput" type="file" accept="application/json,.json" class="sr-only" @change="onImport" />
        </label>
      </div>
      <p v-if="message" class="callout" :class="message.tone" role="status">{{ message.text }}</p>
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
.equipment { border: 0; padding: 0; margin: 0; }
.equipment legend { padding: 0; }
.equipment legend h2 { margin: 0 0 0.25rem; }
</style>
