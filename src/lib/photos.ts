// Photos de progression stockées en IndexedDB, uniquement sur l'appareil.

export type PhotoView = 'face' | 'profil' | 'dos'

export interface PhotoRecord {
  id: string
  date: string
  view: PhotoView
  blob: Blob
}

export interface PhotoExport {
  id: string
  date: string
  view: PhotoView
  dataUrl: string
}

const DB_NAME = 'ari-photos'
const STORE = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close())
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  const all = await tx<PhotoRecord[]>('readonly', (s) => s.getAll() as IDBRequest<PhotoRecord[]>)
  return all.sort((a, b) => b.date.localeCompare(a.date))
}

export const savePhoto = (p: PhotoRecord): Promise<IDBValidKey> => tx('readwrite', (s) => s.put(p))
export const deletePhoto = (id: string): Promise<undefined> => tx('readwrite', (s) => s.delete(id))
export const clearPhotos = (): Promise<undefined> => tx('readwrite', (s) => s.clear())

/** Redimensionne une photo (côté max 1280 px, JPEG 0,82) pour limiter la place occupée. */
export async function compressImage(file: Blob, maxSide = 1280): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.82))
  } catch {
    return file
  }
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

export async function exportPhotos(): Promise<PhotoExport[]> {
  const photos = await listPhotos()
  return Promise.all(photos.map(async (p) => ({ id: p.id, date: p.date, view: p.view, dataUrl: await blobToDataUrl(p.blob) })))
}

export async function importPhotos(items: PhotoExport[]): Promise<void> {
  for (const p of items) {
    const blob = await (await fetch(p.dataUrl)).blob()
    await savePhoto({ id: p.id, date: p.date, view: p.view, blob })
  }
}
