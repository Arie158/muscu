import { describe, expect, it } from 'vitest'
import { catalogExercises } from '@/data/catalog'
import { exercises, exercisesById } from '@/data/exercises'
import { BODY_PARTS, exerciseBodyParts } from '@/lib/muscles'
import { EXTRA_SETS, extraItem, extraLog, extraTarget, insertPosition, loggedWithKg, removeFromOrder } from '@/lib/extra'
import { normalize, searchExercises } from '@/lib/search'

const ids = (list: { id: string }[]) => list.map((e) => e.id)

describe('catalogue complet', () => {
  it('a des identifiants uniques dans tout le catalogue', () => {
    expect(new Set(ids(exercises)).size).toBe(exercises.length)
  })

  it('est vraiment large : plus de 200 fiches, chaque partie du corps couverte par au moins 3 exercices', () => {
    expect(exercises.length).toBeGreaterThan(200)
    // « Jambes » est un libellé générique, seulement en secondaire (cardio, marche).
    for (const part of BODY_PARTS.filter((p) => p !== 'Jambes')) {
      const n = exercises.filter((e) => exerciseBodyParts(e).primary.some((p) => p.label === part)).length
      expect(n, part).toBeGreaterThanOrEqual(3)
    }
  })

  it('chaque fiche du catalogue a technique, erreurs et variantes plus facile / plus difficile', () => {
    for (const e of catalogExercises) {
      expect(e.technique.length, e.id).toBeGreaterThan(0)
      expect(e.mistakes.length, e.id).toBeGreaterThan(0)
      expect(e.easier && e.harder, e.id).toBeTruthy()
    }
  })

  it('le cardio se mesure toujours en minutes (il alimente le total de cardio de la semaine)', () => {
    for (const e of exercises.filter((x) => x.kind === 'cardio')) expect(extraTarget(e).kind, e.id).toBe('minutes')
  })
})

describe('recherche d’exercices', () => {
  it('ignore la casse, les accents et la ponctuation', () => {
    expect(normalize('Développé  couché (Smith)')).toBe('developpe couche smith')
    expect(normalize('Élévations latérales')).toBe('elevations laterales')
  })

  it('trouve par nom sans accents, nom anglais, muscle ou matériel', () => {
    expect(ids(searchExercises(exercises, 'developpe couche'))).toContain('developpe-couche')
    expect(ids(searchExercises(exercises, 'skull crusher'))).toContain('barre-front')
    expect(ids(searchExercises(exercises, 'RDL')).length + ids(searchExercises(exercises, 'deadlift')).length).toBeGreaterThan(0)
    expect(ids(searchExercises(exercises, 'treadmill'))).toContain('tapis-course')
    expect(ids(searchExercises(exercises, 'rameur'))).toContain('rameur')
    expect(searchExercises(exercises, 'ischio').length).toBeGreaterThan(5)
    expect(searchExercises(exercises, 'poulie').length).toBeGreaterThan(10)
  })

  it('exige que tous les mots soient trouvés', () => {
    const list = searchExercises(exercises, 'curl marteau')
    expect(list.length).toBeGreaterThan(0)
    for (const e of list) expect(normalize(`${e.name} ${(e.aliases ?? []).join(' ')}`)).toMatch(/marteau|hammer/)
  })

  it('classe en premier les exercices dont le nom correspond', () => {
    expect(searchExercises(exercises, 'rameur')[0]!.id).toBe('rameur')
    expect(searchExercises(exercises, 'hip thrust')[0]!.name.toLowerCase()).toContain('hip thrust')
  })

  it('renvoie tout pour une recherche vide, rien pour un mot inconnu', () => {
    expect(searchExercises(exercises, '  ')).toHaveLength(exercises.length)
    expect(searchExercises(exercises, 'zzzz')).toEqual([])
  })
})

describe('exercice ajouté hors programme', () => {
  it('propose une cible adaptée à la nature de l’exercice', () => {
    expect(extraTarget(exercisesById['curl-marteau']!)).toEqual({ kind: 'reps', min: 10, max: 15 })
    expect(extraTarget(exercisesById['squat-barre']!)).toEqual({ kind: 'reps', min: 8, max: 12 })
    expect(extraTarget(exercisesById['planche']!).kind).toBe('duree')
    expect(extraTarget(exercisesById['rameur']!).kind).toBe('minutes')
    expect(extraTarget(exercisesById['marche-fermier']!)).toEqual({ kind: 'duree', min: 30, max: 45 })
  })

  it('fabrique un bloc simple de 3 séries, ou une activité sans repos pour le cardio', () => {
    const curl = extraItem(exercisesById['curl-marteau']!, 'extra-1')
    expect(curl).toMatchObject({ id: 'extra-1', format: 'simple', sets: EXTRA_SETS, label: 'Curl marteau' })
    expect(curl.rest.max).toBeGreaterThan(0)
    const tapis = extraItem(exercisesById['tapis-marche-inclinee']!, 'extra-2')
    expect(tapis).toMatchObject({ format: 'activite', sets: 1, rest: { min: 0, max: 0 } })
  })

  it('s’insère après le bloc affiché, en fin depuis le bilan, en premier depuis l’échauffement', () => {
    expect(insertPosition(2, 5)).toBe(2) // étape 2 = order[1] → inséré en order[2] (étape 3)
    expect(insertPosition(6, 5)).toBe(5) // bilan
    expect(insertPosition(0, 5)).toBe(0) // échauffement
  })

  it('se retire de l’ordre de passage en renumérotant les blocs suivants', () => {
    // Séance de 4 blocs, ajout (index 4) placé en 2e position, bloc 1 reporté en fin.
    expect(removeFromOrder([0, 4, 2, 3, 1], 4)).toEqual([0, 2, 3, 1])
    // Deux ajouts (4 et 5) : retirer le premier renumérote le second.
    expect(removeFromOrder([0, 1, 4, 2, 3, 5], 4)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('correction après coup depuis le carnet', () => {
  it('saisit en kg seulement les exercices chargés de la salle', () => {
    expect(loggedWithKg(exercisesById['curl-marteau']!)).toBe(true)
    expect(loggedWithKg(exercisesById['tractions-assistees']!)).toBe(true)
    expect(loggedWithKg(exercisesById['tractions']!)).toBe(false)
    expect(loggedWithKg(exercisesById['pompes']!)).toBe(false) // exercice maison
  })

  it('enregistre les séries saisies comme faites, sans RIR, marquées « ajouté »', () => {
    const log = extraLog(exercisesById['curl-marteau']!, [{ load: 12, reps: 10 }, { load: 12, reps: 9 }], { itemId: 'extra-x' })
    expect(log).toMatchObject({ exerciseId: 'curl-marteau', itemId: 'extra-x', extra: true, techniqueOk: true })
    expect(log.sets).toEqual([
      { load: 12, reps: 10, rir: null, done: true },
      { load: 12, reps: 9, rir: null, done: true },
    ])
  })

  it('ignore les séries vides et la charge des exercices sans kg, garde la variante maison', () => {
    const log = extraLog(exercisesById['pompes']!, [{ load: 20, reps: 12 }, { load: null, reps: null }, { load: null, reps: 0 }], {
      itemId: 'extra-y', equipment: 'none',
    })
    expect(log.sets).toEqual([{ load: null, reps: 12, rir: null, done: true }])
    expect(log.equipment).toBe('none')
  })
})
