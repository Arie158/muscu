# Programme muscu — 26 semaines

Application web statique, mobile-first et hors ligne, qui transforme le programme de musculation
(4 séances salle par semaine chez Basic-Fit + 3 séances maison légères, 110 → 90 kg) en outil de
consultation et de suivi : séances, mode séance avec minuteur de repos, double progression, variantes
de matériel à la maison, plan de 26 semaines, cardio et pas, alimentation, suivi du poids et des mensurations.

> Contenu informatif : il ne remplace pas l'avis d'un médecin ou d'un professionnel de santé.

## Démarrage

Prérequis : Node.js 22 ou plus récent.

```bash
npm install
npm run dev          # serveur de développement (http://localhost:5173)
```

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript (`vue-tsc`) + build de production dans `dist/` |
| `npm run preview` | Sert le build de production localement |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de parcours dans un vrai navigateur (Playwright, taille téléphone, sous-chemin `/sport/`). Sous Windows sans Chromium installé : `set PW_CHANNEL=msedge` (cmd) ou `$env:PW_CHANNEL='msedge'` (PowerShell) pour utiliser Edge |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm run fetch-images` | Télécharge les illustrations, les convertit en WebP (850 px + miniature 240 px) et régénère `docs/images-a-verifier.md` (`-- --force` pour tout retraiter) |
| `npm run icons` | Régénère les icônes PWA et le favicon |

> Windows : si PowerShell refuse `npm` (« l'exécution de scripts est désactivée »), utilise `npm.cmd run dev`
> ou un autre terminal (cmd, Git Bash).

## Semaine type

| Jour | Séance | Durée | Lieu |
|---|---|---|---|
| Lundi | Haut A (force) | 1h15-1h30 | Salle |
| Mardi | Bas A (quadriceps) | 1h15-1h30 | Salle |
| Mercredi | Maison 1 : récupération active et gainage | 35-40 min | Maison |
| Jeudi | Haut B (hypertrophie) | 1h15-1h30 | Salle |
| Vendredi | Bas B (chaîne postérieure) | 1h15-1h30 | Salle |
| Samedi | Maison 2 : conditionnement léger | 45-50 min | Maison |
| Dimanche | Maison 3 : marche et mobilité (optionnelle, transformable en repos complet) | 25-30 min | Maison |

Les 4 séances salle sont prioritaires et gardent l'ordre Haut A → Bas A → Haut B → Bas B ; jamais deux
séances en une. Priorité : (1) salle, Bas A et Bas B d'abord ; (2) Maison 2 ; (3) Maison 1 ; (4) Maison 3,
la première à sauter. Les séances maison se font toujours à RIR 3.

## Principes d'interface

L'app met en avant ce qui sert tous les jours et range le reste :

- **Barre du bas à 4 entrées** : Aujourd'hui, Séances, Suivi, Plus. Plan, Progression, Imprévus, Exercices,
  Cardio, Alimentation, Récupération, Paramètres et thème sont regroupés dans « Plus ».
- **Aujourd'hui** : une seule action principale (démarrer ou reprendre la séance du jour), la semaine en
  une bande de 7 jours, la pesée du matin, et au plus un message important à la fois.
- **Mode séance**, pensé pour la salle (rien ne doit obliger à quitter l'écran) :
  - **miniature animée** de chaque exercice toujours visible ; un toucher ouvre **« Le geste »** par-dessus la
    séance (grande illustration, consigne clé, 3 points techniques, 2 erreurs, alternatives) ;
  - **« Machine occupée ? »** : un seul bouton qui propose les alternatives (même séries et reps, historique de
    charges séparé) ou **« Faire plus tard »** (l'exercice passe en fin de séance). Remplacement possible tant
    qu'aucune série de l'exercice n'est validée ; on peut revenir à l'exercice prévu ;
  - seule la série en cours est dépliée ; les autres tiennent sur une ligne ; la charge et les reps saisies se
    reportent sur les séries suivantes ;
  - **vibration courte** à chaque validation ; quand la dernière série d'un exercice est validée, l'app
    **passe seule à l'exercice suivant** pendant le repos (désactivable dans Paramètres) ;
  - réglages (machine, tempo, technique propre, vrais haltères) repliés ; barre Précédent / Suivant fixe en bas,
    minuteur de repos juste au-dessus.
- **Suivi** : la moyenne 7 jours et une barre de progression vers l'objectif en tête ; alertes sur une ligne
  (détail dépliable) ; 4 onglets (Jour, Mesures, Courbes, Carnet). Mensurations, photos et protocole sont
  repliés ; les courbes montrent le poids puis une seule courbe secondaire au choix.
- **Séances** : listes groupées Salle / Maison, séances de secours repliées ; le détail d'une séance est une
  liste numérotée (exercice, volume, repos et consigne clé) sous un bouton Démarrer.

## Fonctionnalités

- **Aujourd'hui** : séance du jour (salle ou maison) avec un bouton Démarrer / Reprendre, bande des 7 jours
  (faite, repos, aujourd'hui), « Repos complet aujourd'hui » pour Maison 3, pesée du matin avec moyenne
  7 jours, et un seul message prioritaire (séance manquée, décharge, récupération, ajustement…).
- **Séances** Haut A, Bas A, Haut B, Bas B, Maison 1, 2, 3 (+ séances de secours Full body X/Y et séance B mixte).
- **Séances maison** : variante de chaque exercice choisie selon le matériel disponible (élastique,
  charge improvisée, aucun matériel), changeable en cours de séance ; niveau de charge libre (pas de kilos) ;
  tempo ; séries chronométrées avec compte à rebours (et changement de côté) ; circuits en tours avec tour
  courant visible et minuteur entre les tours ; option « vrais haltères » qui réactive la saisie en kg et la
  double progression ; encart sécurité élastique.
- **Mode séance** : un écran par exercice (supersets et circuits regroupés), saisie rapide charge /
  reps / RIR, case « série faite », minuteur de repos automatique (vibration + bip), rappel de la
  dernière performance (par machine), suggestion de progression, mention « technique propre »,
  écran gardé allumé (Wake Lock). La séance en cours survit à un rechargement de la page.
- **Plan de 26 semaines** : 4 blocs, 3 décharges (Maison 2 passe à 2 tours), semaine courante et RIR cible.
- **Progression** : explications, suggestion par exercice, détection de stagnation (−10 %), progression
  maison en 4 étapes, volume ajouté par Maison 2.
- **Cardio et pas** : LISS intégré aux séances maison (comptabilisé automatiquement), HIIT optionnel,
  saisie des pas et du cardio, moyennes hebdomadaires.
- **Alimentation** : repères indicatifs avec avertissement, tableau de décision et situation actuelle.
- **Suivi** : poids quotidien (moyenne glissante 7 jours mise en avant), case « séance maison faite » (ou
  repos complet) par jour, tour de taille, mensurations, photos (IndexedDB, jamais envoyées), sommeil et
  énergie, graphiques (dont régularité salle/maison par semaine), carnet de séances, alertes douces
  (critères de modification, stagnation majoritaire, signaux de récupération).
- **Imprévus** (priorité des séances, ordre dans lequel les sauter), **Récupération**, **Paramètres**
  (date de début, poids, matériel maison, thème, export/import, remise à zéro), **Crédits**.

## Structure

```
src/
  data/          Contenu du programme, typé, sans logique d'affichage
    types.ts         Modèle de données
    exercises.ts     Fiches exercices salle + mapping des illustrations + charges de référence
    homeExercises.ts Fiches exercices maison + variantes de matériel (band / improvised / none)
    sessions.ts      Séances (salle, maison, secours) + ordre de priorité
    home.ts          Règles maison : matériel, tempo, étapes de progression, volume, sécurité, alertes
    plan.ts          Blocs des 26 semaines et RIR par semaine
    week.ts          Semaine type
    progression.ts   Incréments de charge, seuils de stagnation, textes
    cardio.ts        Plan cardio et objectifs de pas
    nutrition.ts     Repères alimentaires et avertissement
    tracking.ts      Protocole de suivi et critères de modification
    contingencies.ts Imprévus
    recovery.ts, profile.ts, credits.ts
  lib/           Logique pure, testée (dates, plan, poids, progression, critères, maison, priorité,
                 semaine, migrations, stockage, photos)
  stores/        Pinia : réglages, suivi, séances enregistrées, séance en cours
  composables/   Horloge, synthèses, sauvegarde, wake lock, reduced motion
  components/    Composants réutilisables (illustration, miniature, panneau du geste, stepper, minuteur, graphique…)
    workout/       Mode séance : liste des séries, saisie d’une série, échauffement, bilan
  views/         Une vue par page
tests/           Tests unitaires Vitest (logique pure)
e2e/             Tests de parcours Playwright (accueil, séance complète, geste, pesée, images, sauvegarde)
scripts/         fetch-images.ts, generate-icons.mjs
public/exercises Illustrations téléchargées (domaine public)
docs/            images-a-verifier.md
```

## Modifier le programme

Tout le contenu vit dans `src/data/*.ts`, typé : TypeScript signale les erreurs au build.

- **Changer un exercice d'une séance** : `src/data/sessions.ts` (séries, fourchette, repos, consigne).
  Les supersets/circuits sont des `SessionItem` avec plusieurs `exercises`.
- **Ajouter / modifier une fiche** : `src/data/exercises.ts` (muscles, consignes, erreurs, variantes,
  `loadType`, `mainLift`, `startingRefs`).
- **Changer une illustration** : modifier `illustration.dbId` / `confidence` dans `exercises.ts`
  (identifiants dans [exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json)),
  puis `npm run fetch-images`.
- **Blocs, décharges, RIR** : `src/data/plan.ts`. **Seuils des critères** : `src/data/tracking.ts`.

### Modifier une séance maison

Dans `src/data/sessions.ts` (`maison1`, `maison2`, `maison3`). Chaque bloc (`SessionItem`) a un `format` :

- `simple` : un exercice, `sets` séries ;
- `circuit` : plusieurs exercices enchaînés, `sets` = nombre de tours, `rest` = repos entre les tours
  (`{ min: 0, max: 0 }` = pas de minuteur, ex. mobilité) ;
- `activite` : marche, vélo… avec une cible en minutes (`mins(15, 20)`).

Cibles : `reps(8, 15)`, `secs(30, 45)` (séries chronométrées), `mins(15, 20)`. Options par exercice :
`perSide: 'côté'` (par côté), `sets: 2` (moins de tours que le bloc, ex. curl + triceps sur 2 tours ;
ou plus, ex. fente basse × 2 dans un tour de mobilité). `deloadSets` fixe le nombre de tours en décharge
(Maison 2 : 2). `warmup` et `notes` s'affichent en tête de séance, `optional: true` permet le repos complet.

### Ajouter un exercice maison

Dans `src/data/homeExercises.ts`, ajouter un objet `Exercise` avec `location: 'home'` et les mêmes champs
que la salle (muscles, matériel, `technique`, `mistakes`, `easier`, `harder`, `illustration`, `videoQuery`).
`kind` vaut `mobilite` ou `cardio` pour les exercices sans RIR ni progression. Le référencer ensuite dans
une séance par son `id`, puis lancer `npm run fetch-images`.

### Modifier les alternatives de salle (machine occupée)

- La liste « exercice du programme → alternatives » est dans `src/data/alternatives.ts`, de la plus proche à
  la moins proche. Une alternative doit travailler la même zone (vérifié par les tests).
- Les exercices de remplacement ont leur propre fiche dans `src/data/gymAlternatives.ts` (même format que
  `exercises.ts`) ; un exercice du programme peut aussi servir d'alternative (ex. leg curl assis ↔ allongé).
- Après ajout d'une fiche avec illustration : `npm run fetch-images`.

### Ajouter une variante de matériel

Dans le champ `variants` de l'exercice, une entrée par matériel (`band`, `improvised`, `none`, 3 au maximum) :

```ts
variants: {
  improvised: {
    label: 'Sac à dos lesté sur le dos',
    instructions: ['…'],
    easier: '…', current: '…', harder: '…',   // échelle de progression propre à la variante
    load: 'niveau',                           // 'niveau' (charge libre) ou 'aucune'
    target: { kind: 'duree', min: 20, max: 30 }, // optionnel : remplace la cible du programme
    perSide: 'bras',                          // optionnel
    illustration: { dbId: 'Pushups', confidence: 'approximatif', note: '…' }, // optionnel
  },
}
```

La variante utilisée est choisie selon le matériel coché dans les Paramètres (préférence : élastique,
puis charge improvisée, puis sans matériel) et reste modifiable en cours de séance. Pour ajouter un
nouveau type de matériel, étendre `HomeEquipment` dans `types.ts`, puis `equipmentLabels` et
`EQUIPMENT_PREFERENCE` dans `home.ts`.

## Déployer sur GitHub Pages

1. Crée un dépôt sur GitHub (ex. `muscu`), puis :
   ```bash
   git init
   git add .
   git commit -m "Programme muscu"
   git branch -M main
   git remote add origin https://github.com/<utilisateur>/<depot>.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` lance les tests, construit avec
   `BASE_PATH=/<depot>/` et publie `dist/`. Le site est ensuite disponible sur
   `https://<utilisateur>.github.io/<depot>/` (onglet **Actions** pour suivre le déploiement).
4. Sur le téléphone : ouvre l'URL puis « Ajouter à l'écran d'accueil » pour l'installer (PWA, hors ligne).

Le chemin de base est configurable : `BASE_PATH=/mon-chemin/ npm run build`. Sans variable, le build
utilise des chemins relatifs (`./`), ce qui fonctionne aussi sous n'importe quel sous-chemin. Le routeur
est en mode hash (`#/suivi`) : aucune 404 au rechargement.

## Sauvegarder et transférer ses données

Les données sont stockées **uniquement dans le navigateur** (localStorage ; photos en IndexedDB).
Elles sont perdues si tu effaces les données du site ou changes de téléphone : sauvegarde régulièrement.

- **Stockage persistant** : au démarrage, l'app demande au navigateur (`navigator.storage.persist()`) de ne
  pas effacer ses données quand l'espace manque. L'état est affiché dans Paramètres → Sauvegarde. Installer
  l'app sur l'écran d'accueil augmente les chances que ce soit accordé (surtout sur iPhone).
- **Paramètres → Sauvegarder maintenant** crée `muscu-sauvegarde-AAAA-MM-JJ.json` (option « Inclure les
  photos »). Sur téléphone, la feuille de partage s'ouvre (Fichiers, Drive, e-mail…) ; sinon le fichier est
  téléchargé.
- **Rappel** : si la dernière sauvegarde date de plus de 15 jours (ou s'il n'y en a jamais eu) et qu'il y a des
  données à perdre, l'accueil propose « Sauvegarder » ; « Plus tard » masque le rappel 3 jours.
- **Paramètres → Importer une sauvegarde** remplace les données de l'appareil par celles du fichier.

## Décisions prises

| Sujet | Décision |
|---|---|
| RIR après la semaine 6 | Le programme ne précise que S1-S6 : les blocs 2-4 reprennent la règle S3-S6 (RIR 1-2 bases, 0-1 dernière série isolations), décharges à RIR 3. |
| Décharge (−40-50 % de volume) | Le mode séance garde ~55 % des séries, arrondi au supérieur (4 → 3, 3 → 2). |
| Bloc 3 « bases en 5-8 » | Appliqué aux exercices `mainLift` : développé couché, tirage vertical, squat, SDT roumain, développé incliné haltères, tirage prise neutre. |
| Repos par défaut | Milieu de la fourchette arrondi à 15 s (2-3 min → 2 min 30, 60-90 s → 75 s), ajustable ±15 s. |
| Incrément proposé | Mouvements de base : borne haute (+2,5 kg haut, +5 kg bas) ; isolations : borne basse (+1 kg haut, +2,5 kg bas). La fourchette complète est rappelée. |
| Dips assistés | Progresser = réduire l'assistance ; « −10 % » en stagnation = +10 % d'assistance. |
| Stagnation | 3 séances enregistrées de suite qui ne dépassent pas la séance de référence (charge plus haute, ou même charge et plus de reps). Une baisse de charge volontaire relance le compteur. |
| Stagnation « majoritaire » | Plus de 50 % des exercices suivis sans progrès sur 14 jours → suggestion d'avancer la décharge. |
| Critères de modification | Évalués dès S3 sur 2 semaines : perte = écart entre la moyenne 7 j actuelle et celle d'il y a 14 jours (≥ 3 pesées par fenêtre). Tour de taille « stable » si |Δ| < 0,5 cm ; poids « stable » si < 0,2 kg/sem ; tendance des charges majoritaire (> 50 %). Les zones 0,4-0,5 et 1-1,2 kg/sem ne déclenchent rien. |
| Objectifs de pas | S1 : mesure ; S2-S3 : 8 000 ; S4 : 9 000 ; S5+ : 10 000. HIIT proposé à partir de S5 (mois 2). |
| Charges de référence | Leg press 60 et 86 kg = deux machines nommées ; « seat row 45 kg » rattaché au low row ; « arm curl 36 kg » rattaché au curl poulie ; « poulie réglable 20 kg » aux exercices à la poulie (triceps, face pull, pec deck/écarté, extension au-dessus de la tête). Tout est modifiable sur la fiche exercice. |
| Date de début par défaut | Le lundi de la semaine du premier lancement (modifiable). |
| Mode reprise | Activable depuis Imprévus : −10 % de charge et 1 série de moins pendant 7 jours. |
| TypeScript | Version 5.9 (TypeScript 7 n'expose plus l'API utilisée par `vue-tsc`). |
| Pas de Tailwind | CSS maison avec variables (thèmes clair/sombre, contrastes AA). |
| Images et hors ligne | Illustrations en WebP (pleine taille 850 px + miniature 240 px, environ −50 % par rapport aux JPG). À l'installation, seules les images des exercices du programme sont pré-chargées (~4,5 Mo au total avec l'app) ; celles des alternatives sont mises en cache au premier affichage et préchargées en arrière-plan 15 s après le lancement (en ligne, hors mode économie de données). La liste « programme » est calculée dans `src/data/imageSets.ts`. |

### Séances maison (v2)

| Sujet | Décision |
|---|---|
| Choix de la variante | Préférence élastique → charge improvisée → sans matériel, parmi le matériel coché ; à défaut la variante sans matériel. Matériel par défaut : élastique + charge improvisée. |
| Charge élastique | Comme la charge improvisée : un « niveau » libre (ex. « élastique rouge »), pas de kilos. |
| Vrais haltères | Case dans la variante « charge improvisée » : saisie en kg et double progression de la salle, historique séparé. |
| Progression maison | Étape 1 tant qu'une série est sous le haut de fourchette ; étape 2 : tempo normal → 3 s → 4 s + pause ; étape 3 : charge (tempo remis à normal) ; étape 4 si la variante n'a pas de charge, ou si les 2 dernières séances étaient au maximum (haut de fourchette, tempo 4 s) avec le même niveau de charge. Le tempo utilisé est saisi en séance. |
| Exercices maison et critères | Les exercices maison sont exclus des critères de modification, de la stagnation et de la tendance des charges (règles salle). |
| Décharge maison | Maison 2 : 2 tours (`deloadSets`) ; le superset curl + triceps reste à 2 tours. Maison 1 et 3 inchangées. Le mode reprise ne s'applique qu'aux séances salle. |
| Maison 1 | Repos de la posture (face pull élastique / Y-T-W) non précisé : 45 s, comme le gainage. Mobilité sans minuteur ni RIR. |
| Planche de Maison 2 | Réutilise la fiche « Planche » de la salle (pas de matériel, version sur les genoux en plus facile). |
| Signaux d'alerte | Fenêtre de 7 jours : ≥ 2 exercices de salle dont la dernière séance est moins bonne que la précédente ; sommeil ≤ 2/5 sur ≥ 2 jours ; énergie ≤ 2/5 sur ≥ 2 jours. « Lundi/jeudi en baisse » = dernière séance Haut A ou Haut B en baisse sur plus de la moitié de ses exercices → retirer d'abord des séries à Maison 2. |
| Priorité | Ordre complet : Bas A, Bas B, Haut A, Haut B, Maison 2, Maison 1, Maison 3 ; on saute dans l'ordre inverse. |
| Séance manquée | Une séance salle manquée se rattrape le lendemain et passe avant la séance maison du jour ; une séance maison manquée ne se rattrape pas. |
| Repos complet (Maison 3) | Noté dans le suivi du jour (`home: 'repos'`) ; non compté comme séance manquée dans la régularité. Une séance maison enregistrée coche automatiquement « séance maison faite ». |
| Cardio | Les minutes de cardio doux et de marche des séances maison s'ajoutent au total hebdomadaire de la page Cardio. |
| Migration | Schéma v2 (`ari:v1:schema = 2`) appliqué au démarrage : lieu de chaque séance, élastique par défaut pour les exercices maison sans variante, matériel par défaut dans les réglages, séance en cours complétée. Les sauvegardes JSON v1 restent importables (migrées à l'import). |

## Tests

Les tests de parcours (`e2e/`) pilotent l'app dans un navigateur à la taille d'un téléphone, avec une date
figée (un lundi) : séance du jour, séance complète avec « machine occupée », enchaînement automatique,
« faire plus tard » et enregistrement, panneau du geste, pesée du matin, chargement des illustrations sous
le sous-chemin GitHub Pages, rappel de sauvegarde. Le workflow de déploiement les exécute avant de publier.


`npm test` couvre : moyenne glissante du poids, double progression (incréments, assistance, durée,
référence), détection de stagnation, semaine courante / blocs / RIR (y compris changement d'heure),
ajustements de volume, critères de modification, tendance et stagnation majoritaire ; et pour les séances
maison : séance du jour avec la nouvelle semaine type, tours de Maison 2 en décharge, choix de la variante
selon le matériel, progression en 4 étapes, priorité et ordre de sacrifice, signaux d'alerte, régularité
hebdomadaire et migration des données localStorage.

## Crédits

Voir [CREDITS.md](CREDITS.md). Illustrations : [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).
