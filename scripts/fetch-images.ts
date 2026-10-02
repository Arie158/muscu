/**
 * Télécharge les illustrations des exercices depuis yuhonas/free-exercise-db
 * (licence Unlicense / domaine public), les convertit en WebP dans
 * public/exercises/<dbId>/{0,1}.webp (850 px) et {0,1}-thumb.webp (240 px, miniatures),
 * puis génère docs/images-a-verifier.md.
 *
 * Usage : npm run fetch-images            (ne retraite pas les images déjà converties)
 *         npm run fetch-images -- --force (retélécharge et reconvertit tout)
 *
 * Le mapping exercice → image vit dans src/data/exercises.ts et src/data/homeExercises.ts
 * (champ `illustration`, et `variants.<matériel>.illustration` pour les variantes maison).
 */
import { mkdir, writeFile, access, readFile, unlink } from 'node:fs/promises'
import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exercises } from '../src/data/exercises.ts'
import { sessions } from '../src/data/sessions.ts'
import { alternatives } from '../src/data/alternatives.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_RAW = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'
const OUT_DIR = join(ROOT, 'public', 'exercises')
const force = process.argv.includes('--force')

interface DbExercise {
  id: string
  name: string
  equipment: string | null
  primaryMuscles: string[]
  images: string[]
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Tailles produites : pleine taille pour l'illustration, miniature pour les listes et le mode séance. */
const SIZES = [
  { suffix: '', width: 850, quality: 72 },
  { suffix: '-thumb', width: 240, quality: 68 },
] as const

/** Convertit une image source (JPG) en WebP aux deux tailles. */
async function toWebp(source: Buffer, destBase: string): Promise<void> {
  await mkdir(dirname(destBase), { recursive: true })
  for (const size of SIZES) {
    const out = await sharp(source).resize({ width: size.width, withoutEnlargement: true }).webp({ quality: size.quality }).toBuffer()
    await writeFile(`${destBase}${size.suffix}.webp`, out)
  }
}

async function main(): Promise<void> {
  console.log('Lecture de la base free-exercise-db…')
  const res = await fetch(`${REPO_RAW}/dist/exercises.json`)
  if (!res.ok) throw new Error(`Impossible de lire exercises.json (${res.status})`)
  const db = (await res.json()) as DbExercise[]
  const byId = new Map(db.map((e) => [e.id, e]))

  const problems: string[] = []
  // Une entrée par illustration : l'exercice, puis chacune de ses variantes de matériel illustrées.
  const variantLabels = { band: 'élastique', improvised: 'charge improvisée', none: 'sans matériel' } as const
  const entries = exercises.flatMap((e) => [
    { exercise: e, label: e.name, illustration: e.illustration },
    ...(['band', 'improvised', 'none'] as const).flatMap((k) => {
      const v = e.variants?.[k]
      return v?.illustration ? [{ exercise: e, label: `↳ ${variantLabels[k]} : ${v.label}`, illustration: v.illustration }] : []
    }),
  ])
  const dbIds = [...new Set(entries.map((x) => x.illustration.dbId).filter((id): id is string => !!id))]

  for (const dbId of dbIds) {
    const entry = byId.get(dbId)
    if (!entry) {
      problems.push(`Identifiant introuvable dans la base : ${dbId}`)
      continue
    }
    for (const img of entry.images.slice(0, 2)) {
      const jpg = join(OUT_DIR, img) // ex. <dbId>/0.jpg
      const base = jpg.replace(/\.jpg$/i, '')
      if (!force && (await exists(`${base}.webp`)) && (await exists(`${base}-thumb.webp`))) continue
      // Un JPG déjà présent (ancienne version) est converti sans retélécharger.
      const source = !force && (await exists(jpg)) ? await readFile(jpg) : await download(`${REPO_RAW}/exercises/${img}`)
      await toWebp(source, base)
      if (await exists(jpg)) await unlink(jpg)
      console.log(`  ✓ ${img.replace(/\.jpg$/i, '.webp')}`)
    }
  }

  // ── docs/images-a-verifier.md ──
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? id
  const usedIn = (exerciseId: string): string => {
    const inSessions = sessions
      .filter((s) => s.items.some((i) => i.exercises.some((x) => x.exerciseId === exerciseId)))
      .map((s) => s.name)
    const altOf = Object.entries(alternatives)
      .filter(([, list]) => list.includes(exerciseId))
      .map(([id]) => nameOf(id))
    return [...inSessions, ...(altOf.length ? [`alternative à : ${altOf.join(', ')}`] : [])].join(' · ')
  }

  const badge = { exact: '✅ exact', approximatif: '⚠️ approximatif', aucune: '❌ aucune' } as const
  const row = (x: (typeof entries)[number]) => {
    const { dbId, confidence, note } = x.illustration
    const dbName = dbId ? (byId.get(dbId)?.name ?? '— introuvable —') : '—'
    const imgs = dbId ? `[0](../public/exercises/${dbId}/0.webp) · [1](../public/exercises/${dbId}/1.webp)` : '—'
    const used = x.label.startsWith('↳') ? '' : usedIn(x.exercise.id)
    return `| ${x.label} | ${used} | ${dbId ? `\`${dbId}\`` : '—'} (${dbName}) | ${imgs} | ${badge[confidence]} | ${note ?? ''} |`
  }
  const header = '| Exercice | Séances | Entrée de la base | Images | Confiance | Remarque |\n|---|---|---|---|---|---|'
  const gymRows = entries.filter((x) => x.exercise.location !== 'home').map(row)
  const homeRows = entries.filter((x) => x.exercise.location === 'home').map(row)

  const counts = {
    exact: entries.filter((x) => x.illustration.confidence === 'exact').length,
    approximatif: entries.filter((x) => x.illustration.confidence === 'approximatif').length,
    aucune: entries.filter((x) => x.illustration.confidence === 'aucune').length,
  }

  const md = `# Images à vérifier

Fichier généré par \`npm run fetch-images\` (scripts/fetch-images.ts). Ne pas éditer à la main :
modifier le champ \`illustration\` dans \`src/data/exercises.ts\` (salle) ou \`src/data/homeExercises.ts\`
(maison, y compris \`variants.<matériel>.illustration\`) puis relancer le script.

Source : [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) — licence Unlicense (domaine public).

Résumé (${entries.length} illustrations, variantes de matériel comprises) : **${counts.exact}** exactes · **${counts.approximatif}** approximatives · **${counts.aucune}** sans image.

- ✅ **exact** : l'image montre le même mouvement (parfois une variante d'équipement, précisée en note).
- ⚠️ **approximatif** : exercice similaire (machine Basic-Fit spécifique, haltère au lieu de bouteille, poulie au lieu d'élastique…) — la fiche affiche « illustration d'un exercice similaire ».
- ❌ **aucune** : icône de substitution + lien vers une démonstration vidéo YouTube.

## Salle

${header}
${gymRows.join('\n')}

## Maison

Les lignes « ↳ » sont les illustrations propres à une variante de matériel.

${header}
${homeRows.join('\n')}

## Comment vérifier

1. Ouvre chaque lien d'image (ou la fiche exercice dans l'app).
2. Si une image ne convient pas, cherche un meilleur identifiant dans
   [exercises.json](https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises.json),
   mets à jour \`illustration.dbId\` / \`confidence\` dans le fichier de données, puis relance \`npm run fetch-images\`.
3. Pour retirer une image : \`dbId: null, confidence: 'aucune'\`.
${problems.length ? `\n## Problèmes détectés\n\n${problems.map((p) => `- ${p}`).join('\n')}\n` : ''}`

  await mkdir(join(ROOT, 'docs'), { recursive: true })
  await writeFile(join(ROOT, 'docs', 'images-a-verifier.md'), md)
  console.log(`\n${dbIds.length} illustrations traitées. docs/images-a-verifier.md mis à jour.`)
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exitCode = 1
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
