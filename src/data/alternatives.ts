// Alternatives proposées quand une machine est occupée ou indisponible.
// Clé = exercice du programme ; valeur = exercices de remplacement, du plus proche au moins proche.
// Chaque alternative est un exercice à part entière (fiche + historique de charges séparé).
// Pour modifier : changer les identifiants ci-dessous (catalogue : exercises.ts, gymAlternatives.ts,
// homeExercises.ts). Une alternative doit travailler les mêmes muscles avec un geste proche.

export const alternatives: Record<string, string[]> = {
  // Haut A / Haut B
  'developpe-couche': ['chest-press-machine', 'developpe-couche-barre'],
  'tirage-vertical': ['tractions-assistees', 'tirage-un-bras'],
  'tirage-vertical-neutre': ['tractions-assistees', 'tirage-un-bras'],
  'developpe-incline-machine': ['developpe-incline-halteres'],
  'developpe-incline-halteres': ['developpe-incline-machine'],
  'low-row': ['rowing-poulie-basse', 'rowing-un-bras'],
  'rowing-un-bras': ['rowing-poulie-basse', 'low-row'],
  'developpe-epaules-machine': ['developpe-epaules-halteres', 'developpe-epaules-smith'],
  'elevations-laterales': ['elevations-laterales-poulie'],
  'extension-triceps-poulie': ['barre-front-halteres', 'extension-triceps-nuque'],
  'extension-triceps-nuque': ['barre-front-halteres', 'extension-triceps-poulie'],
  'curl-poulie': ['curl-halteres', 'curl-machine'],
  'curl-incline': ['curl-halteres', 'curl-poulie'],
  'dips-assistes': ['dips-machine', 'developpe-decline'],
  'pec-deck': ['ecarte-poulie', 'ecarte-halteres'],
  'face-pull': ['oiseau-machine', 'oiseau-halteres'],
  // Bas A / Bas B
  'squat-smith': ['hack-squat', 'presse-cuisses'],
  'presse-cuisses': ['hack-squat', 'goblet-squat'],
  'presse-pieds-hauts': ['hack-squat', 'presse-cuisses'],
  fentes: ['split-squat-smith'],
  'leg-curl-assis': ['leg-curl-allonge'],
  'leg-curl-allonge': ['leg-curl-assis'],
  'leg-extension': ['sissy-squat', 'goblet-squat'],
  'mollets-assis': ['mollets-presse', 'mollets-debout'],
  'mollets-debout': ['mollets-presse', 'mollets-assis'],
  'souleve-terre-roumain': ['sdt-roumain-halteres', 'sdt-roumain-smith'],
  'hip-thrust': ['hip-thrust-barre'],
  adducteurs: ['adduction-poulie'],
  // Tronc
  'crunch-poulie': ['crunch-machine'],
  'pallof-press': ['planche-laterale'],
  'releves-genoux': ['reverse-crunch'],
}
