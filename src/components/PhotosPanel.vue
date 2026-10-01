<script setup lang="ts">
// Photos de progression : IndexedDB local, jamais envoyées nulle part.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { photoViews } from '@/data/tracking'
import { formatShort } from '@/lib/dates'
import { compressImage, deletePhoto, listPhotos, savePhoto, type PhotoRecord, type PhotoView } from '@/lib/photos'
import { uid } from '@/lib/storage'
import { useSettingsStore } from '@/stores/settings'
import AppIcon from './AppIcon.vue'

const settings = useSettingsStore()
const photos = ref<(PhotoRecord & { url: string })[]>([])
const date = ref(settings.today)
const view = ref<PhotoView>('face')
const error = ref('')
const busy = ref(false)

function revokeAll() {
  photos.value.forEach((p) => URL.revokeObjectURL(p.url))
}
async function refresh() {
  try {
    revokeAll()
    photos.value = (await listPhotos()).map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }))
  } catch {
    error.value = 'Le stockage des photos n’est pas disponible sur ce navigateur (navigation privée ?).'
  }
}
async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  busy.value = true
  try {
    await savePhoto({ id: uid(), date: date.value, view: view.value, blob: await compressImage(file) })
    await refresh()
  } catch {
    error.value = 'Impossible d’enregistrer la photo.'
  } finally {
    busy.value = false
    input.value = ''
  }
}
async function remove(p: PhotoRecord) {
  if (!window.confirm(`Supprimer la photo « ${p.view} » du ${formatShort(p.date)} ?`)) return
  await deletePhoto(p.id)
  await refresh()
}

onMounted(refresh)
onBeforeUnmount(revokeAll)
const viewLabel = (v: PhotoView) => photoViews.find((x) => x.key === v)?.label ?? v
</script>

<template>
  <div class="stack">
    <div class="callout">
      <p class="small">
        Toutes les 4 semaines : face, profil, dos, même lumière. Les photos restent <strong>uniquement sur cet appareil</strong>
        (IndexedDB) et ne sont jamais envoyées sur Internet.
      </p>
    </div>
    <div class="card stack-sm">
      <div class="grid-2">
        <div class="field">
          <label for="photo-date">Date</label>
          <input id="photo-date" v-model="date" type="date" :max="settings.today" />
        </div>
        <div class="field">
          <label for="photo-view">Vue</label>
          <select id="photo-view" v-model="view">
            <option v-for="v in photoViews" :key="v.key" :value="v.key">{{ v.label }}</option>
          </select>
        </div>
      </div>
      <label class="btn primary block file-btn">
        <AppIcon name="camera" /> {{ busy ? 'Enregistrement…' : 'Prendre / choisir une photo' }}
        <input type="file" accept="image/*" capture="environment" class="sr-only" :disabled="busy" @change="onFile" />
      </label>
      <p v-if="error" class="small" role="alert">{{ error }}</p>
    </div>
    <p v-if="!photos.length" class="muted">Aucune photo pour l’instant.</p>
    <ul class="list-plain gallery">
      <li v-for="p in photos" :key="p.id" class="card">
        <img :src="p.url" :alt="`Photo ${viewLabel(p.view)} du ${formatShort(p.date)}`" loading="lazy" />
        <div class="row-between">
          <span class="small"><strong>{{ viewLabel(p.view) }}</strong> · {{ formatShort(p.date) }}</span>
          <button type="button" class="btn icon ghost" :aria-label="`Supprimer la photo ${viewLabel(p.view)} du ${formatShort(p.date)}`" @click="remove(p)">
            <AppIcon name="trash" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.file-btn { cursor: pointer; }
.gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
.gallery li + li { margin-top: 0; }
.gallery .card { padding: 0.5rem; }
.gallery img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 8px; margin-bottom: 0.35rem; }
</style>
