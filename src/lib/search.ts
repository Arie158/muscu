// Recherche d'exercices : insensible à la casse, aux accents et à la ponctuation.
// Cherche dans le nom, les autres noms (anglais, jargon), les muscles et le matériel ;
// tous les mots tapés doivent être trouvés. Les résultats dont le nom correspond passent en premier.
import type { Exercise } from '@/data/types'

/** « Développé couché » → « developpe couche » (minuscules, sans accents ni ponctuation). */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`\-_/().,+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface Indexed {
  exercise: Exercise
  name: string
  aliases: string
  rest: string
}

const cache = new WeakMap<Exercise, Indexed>()
function indexed(exercise: Exercise): Indexed {
  let entry = cache.get(exercise)
  if (!entry) {
    entry = {
      exercise,
      name: ` ${normalize(exercise.name)}`,
      aliases: ` ${normalize((exercise.aliases ?? []).join(' | '))}`,
      rest: ` ${normalize([...exercise.primaryMuscles, ...exercise.secondaryMuscles, exercise.equipment].join(' | '))}`,
    }
    cache.set(exercise, entry)
  }
  return entry
}

/** Score de pertinence (0 = ne correspond pas). Un mot qui commence un mot du nom compte plus qu'un fragment. */
function score(entry: Indexed, words: string[]): number {
  let total = 0
  for (const w of words) {
    if (entry.name.includes(` ${w}`)) total += 4
    else if (entry.name.includes(w)) total += 3
    else if (entry.aliases.includes(` ${w}`)) total += 3
    else if (entry.aliases.includes(w)) total += 2
    else if (entry.rest.includes(w)) total += 1
    else return 0
  }
  return total
}

/** Exercices correspondant à la recherche, du plus pertinent au moins pertinent (ordre d'origine à égalité). */
export function searchExercises(list: Exercise[], query: string): Exercise[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (!words.length) return list
  return list
    .map((exercise, i) => ({ exercise, i, s: score(indexed(exercise), words) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.exercise)
}
