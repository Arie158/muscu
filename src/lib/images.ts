// Chemins des illustrations (WebP générés par scripts/fetch-images.ts).
// 'full' = 850 px pour l'illustration du geste ; 'thumb' = 240 px pour les miniatures et listes.

export type ImageSize = 'full' | 'thumb'

export function exerciseImage(dbId: string, frame: 0 | 1 | number, size: ImageSize = 'full'): string {
  return `${import.meta.env.BASE_URL}exercises/${dbId}/${frame}${size === 'thumb' ? '-thumb' : ''}.webp`
}
