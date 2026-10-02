# Crédits

## Illustrations des exercices

- **Source** : [Free Exercise DB — yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
- **Licence** : [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE) (domaine public)
- **Utilisation** : les images (`exercises/<id>/0.jpg` et `1.jpg`) sont téléchargées par
  `scripts/fetch-images.ts` dans `public/exercises/` et servies par le site lui-même (aucun hotlinking).
- Certaines images montrent un **exercice similaire** à la machine réellement utilisée (machines
  Basic-Fit spécifiques) ou au matériel utilisé à la maison (haltère au lieu de bouteilles, poulie au lieu
  d'élastique, barre au lieu de table) : c'est indiqué sur la fiche de l'exercice et dans
  [`docs/images-a-verifier.md`](docs/images-a-verifier.md).
- Exercices maison illustrés par la même source : cat-cow (`Cat_Stretch`), fente basse (`Kneeling_Hip_Flexor`),
  étirement des ischios (`Hamstring_Stretch`), rotation thoracique (`Spinal_Stretch`), étirement des pectoraux
  (`Chair_Upper_Body_Stretch`), dead bug (`Dead_Bug`), planche latérale (`Side_Bridge`), pompes (`Pushups`,
  `Incline_Push-Up`), rowing (`Seated_Cable_Rows`, `One-Arm_Dumbbell_Row`, `Inverted_Row`), squat
  (`Squats_-_With_Bands`, `Goblet_Squat`, `Bodyweight_Squat`), pont fessier (`Butt_Lift_Bridge`,
  `Barbell_Glute_Bridge`), élévations latérales (`Lateral_Raise_-_With_Bands`, `Side_Lateral_Raise`),
  curl (`Close-Grip_EZ-Bar_Curl_with_Band`, `Dumbbell_Bicep_Curl`), extension triceps
  (`Speed_Band_Overhead_Triceps`, `Standing_Dumbbell_Triceps_Extension`, `Bench_Dips`), marche
  (`Walking_Treadmill`, `Trail_Running_Walking`), face pull (`Face_Pull`).
- Alternatives de salle (machine occupée), même source : chest press (`Leverage_Chest_Press`), développé
  couché barre, décliné, écartés poulie et haltères, tractions assistées (`Band_Assisted_Pull-Up`), tirage un
  bras, rowing poulie basse, oiseau machine et haltères, développé épaules haltères et Smith, élévations
  poulie, extension triceps couché, curl haltères et machine, dips machine, hack squat, goblet squat, split
  squat Smith, sissy squat, mollets à la presse, SDT roumain haltères et Smith, hip thrust barre, adduction
  poulie, crunch machine, crunch inversé. Le détail est dans `docs/images-a-verifier.md`.
- Sans image dans la base (icône de substitution + lien vers une recherche YouTube) : 90/90 hanches,
  bird dog, Y-T-W au sol, curl serviette.
- Aucune image n'a été copiée d'une autre source ni générée.

## Icônes

Icônes de l'interface et icônes de l'application dessinées pour le projet (SVG inline et
`scripts/generate-icons.mjs`).

## Bibliothèques

| Bibliothèque | Licence |
|---|---|
| [Vue.js](https://vuejs.org) | MIT |
| [Vue Router](https://router.vuejs.org) | MIT |
| [Pinia](https://pinia.vuejs.org) | MIT |
| [Chart.js](https://www.chartjs.org) | MIT |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) / Workbox | MIT |
| [Vite](https://vite.dev), [Vitest](https://vitest.dev) | MIT |
