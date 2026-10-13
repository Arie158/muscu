import type { Illustration } from './types'

// Illustrations absentes de free-exercise-db, prises sur wger.de (images sous CC BY-SA 4.0,
// crédit de l'auteur affiché sous l'image). Une seule image par exercice (départ et fin réunis).
// Seuls des dessins originaux ont été retenus : pas de rendus recopiés d'éditeurs commerciaux,
// pas de photos avec filigrane ou logo, pas d’images signalées comme générées par IA sur wger.

type External = Pick<Illustration, 'dbId' | 'external'>

const wger = (imageId: number, exerciseId: number, file: string, author: string): External => ({
  dbId: `wger-${imageId}`,
  external: {
    url: `https://wger.de/media/exercise-images/${exerciseId}/${file}`,
    author,
    license: 'CC BY-SA 4.0',
    page: `https://wger.de/fr/exercise/${exerciseId}/view-base`,
  },
})

export const WGER = {
  birdDog: wger(271, 957, '0fd94587-6021-4763-856e-7227f5fcba2a.png', 'utkb'),
  planche: wger(334, 1091, '50c8912d-54ef-46c9-99d1-633b6196aa1e.jpg', 'clafal'),
  chaiseMurale: wger(601, 1733, '4ef77069-beb2-4504-a4f3-b181d5f35212.png', 'Tierrasverdes'),
  presseUnilaterale: wger(603, 1735, '43bca7d9-2333-43f3-8554-2d0b39fa2a07.png', 'Tierrasverdes'),
  kettlebellSwing: wger(669, 960, 'da4d0560-da89-4bb5-b91f-746458fb04ad.png', 'contributeurs wger.de'),
} as const
