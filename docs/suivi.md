# Suivi du projet

Liste des demandes, corrections et idées en attente, et de ce qui a été livré.
Chaque entrée a un identifiant (`S-001`…) pour pouvoir en parler et la citer dans les messages de commit.

Statuts : 🆕 à faire · 🔍 à préciser · 🚧 en cours · ✅ fait

Type : 🐞 bug · ✨ fonctionnalité · 🎨 ergonomie

## En cours et à faire

| Id | Type | Sujet | Statut | Notes |
|---|---|---|---|---|
| — | | (rien en attente) | | |

## Fait

| Id | Type | Sujet | Livré le | Commit |
|---|---|---|---|---|
| S-003 | ✨ | Muscles : liste fixe de 21 muscles (épaule avant / côté / arrière), séries par muscle et par semaine (prévu, semaine en cours, moyenne 4 semaines) avec repères, alertes d'équilibre (pousser/tirer, épaules avant/arrière, quadriceps/ischios) dans Progression | 2026-10-13 | 59e22f9, 955d236 |
| S-001 | 🐞 | Fiche exercice : « Retour » ramène à la page d'origine (séance, carnet, liste filtrée) ; vers la liste des exercices seulement si la fiche est ouverte directement | 2026-10-13 | 8fa14e8 |
| S-002 | 🎨 | Ajout d'un exercice non prévu : bouton après le dernier exercice de la séance (plus dans « Options » de chaque bloc) et au bilan ; dans le carnet, juste sous la liste des exercices | 2026-10-13 | b860792 |
| — | ✨ | Modification des séries d'un exercice enregistré dans le carnet | 2026-10-08 | 55fe223 |
| — | ✨ | Ajout après coup d'un exercice oublié dans le carnet | 2026-10-08 | 3d1f8cc |
| — | ✨ | Ajout d'un exercice non prévu en séance, catalogue de 225 fiches | 2026-10-08 | 184bf24 |

## Mode d'emploi

- Nouvelle demande : ajouter une ligne en bas de « En cours et à faire » avec l'identifiant suivant.
- Quand c'est livré : déplacer la ligne dans « Fait » avec la date et le commit, et citer l'identifiant dans le message de commit (ex. `Fiche exercice : retour vers la page d'origine (S-001)`).
- Les illustrations à corriger ont leur propre liste, générée automatiquement : [images-a-verifier.md](images-a-verifier.md).
