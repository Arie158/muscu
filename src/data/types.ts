// Types du modèle de données du programme.
// Ces fichiers ne contiennent que des données : aucune logique d'affichage.
// Important : pas d'`enum` (le script scripts/fetch-images.ts importe ces fichiers
// avec `node --experimental-strip-types`, qui ne supporte que la syntaxe effaçable).

/** Zone du corps, utilisée pour l'incrément de charge et l'icône de substitution. */
export type BodyRegion = 'haut' | 'bas' | 'tronc' | 'global'

/**
 * Nature de l'exercice : influe sur la progression et sur la saisie.
 * `mobilite` et `cardio` n'ont ni RIR ni progression de charge.
 */
export type ExerciseKind = 'base' | 'isolation' | 'gainage' | 'mobilite' | 'cardio'

/**
 * Comment la charge s'interprète :
 * - `poids` : plus c'est lourd, mieux c'est ;
 * - `assistance` : contrepoids d'une machine assistée, progresser = réduire ;
 * - `poids-du-corps` : pas de charge en kg à saisir (reps uniquement) ;
 * - `duree` : exercice chronométré (gainage), on saisit des secondes.
 */
export type LoadType = 'poids' | 'assistance' | 'poids-du-corps' | 'duree'

/** Lieu d'une séance ou d'un exercice. */
export type Location = 'gym' | 'home'

/** Matériel disponible à la maison (une variante d'exécution par matériel). */
export type HomeEquipment = 'band' | 'improvised' | 'none'

/** Niveau de confiance du rapprochement avec la base d'images. */
export type ImageConfidence = 'exact' | 'approximatif' | 'aucune'

export interface Illustration {
  /** Identifiant dans yuhonas/free-exercise-db (dossier `exercises/<id>/`). */
  dbId: string | null
  confidence: ImageConfidence
  /** Précision affichée sous l'image (ex. « machine différente »). */
  note?: string
}

export interface StartingReference {
  /** Nom de la machine (modifiable dans l'app). */
  machine: string
  /** Charge en kg (ou assistance en kg pour les dips assistés). */
  load: number
}

export type Target =
  | { kind: 'reps'; min: number; max: number }
  | { kind: 'duree'; min: number; max: number } // secondes
  | { kind: 'minutes'; min: number; max: number } // activités (marche, vélo…)

/**
 * Variante d'exécution selon le matériel disponible à la maison.
 * L'échelle de progression (plus facile → actuelle → plus difficile) s'applique
 * à l'intérieur de chaque variante.
 */
export interface EquipmentVariant {
  label: string
  instructions: string[]
  easier: string
  current: string
  harder: string
  /** `niveau` : charge libre (élastique, nombre de bouteilles…) ; `aucune` : rien à saisir. */
  load: 'niveau' | 'aucune'
  /** Cible propre à la variante (ex. élévations latérales isométriques en secondes). */
  target?: Target
  /** « bras », « côté »… si la variante se fait d'un côté à la fois. */
  perSide?: string
  illustration?: Illustration
  videoQuery?: string
}

export interface Exercise {
  id: string
  name: string
  location?: Location // défaut : 'gym'
  region: BodyRegion
  kind: ExerciseKind
  loadType: LoadType
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
  /** Consignes techniques détaillées (la consigne clé de la séance s'y ajoute). */
  technique: string[]
  mistakes: string[]
  easier: string
  harder: string
  illustration: Illustration
  /** Requête YouTube pour la démonstration vidéo. */
  videoQuery: string
  /** Mouvement de base concerné par le bloc 3 (5-8 reps) et les règles de RIR. */
  mainLift?: boolean
  /** Jamais d'échec total sur ce mouvement. */
  noFailure?: boolean
  /** Charges de départ de référence (Basic-Fit), pré-remplies comme « dernière performance ». */
  startingRefs?: StartingReference[]
  /** Variantes de matériel (exercices maison). */
  variants?: Partial<Record<HomeEquipment, EquipmentVariant>>
  /** Autres noms pour la recherche (anglais, jargon de salle) : « bench », « RDL »… */
  aliases?: string[]
  /** Cible proposée quand l'exercice est ajouté hors programme (sinon déduite de sa nature). */
  defaultTarget?: Target
}

export interface ItemExercise {
  exerciseId: string
  target: Target
  /** « jambe », « bras », « côté » */
  perSide?: string
  /** Nombre de séries/tours pour cet exercice s'il diffère du bloc (ex. 2 tours sur 3). */
  sets?: number
}

/**
 * Un « bloc » de séance : exercice seul, superset, circuit en tours,
 * ou activité continue (marche, vélo) mesurée en minutes.
 */
export interface SessionItem {
  id: string
  /** Libellé affiché tel que dans le programme. */
  label: string
  format: 'simple' | 'superset' | 'circuit' | 'activite'
  sets: number
  /** Séries/tours en semaine de décharge, si la séance a une règle propre (maison). */
  deloadSets?: number
  /** Repos en secondes (fourchette) ; 0 = pas de minuteur. */
  rest: { min: number; max: number }
  restLabel: string
  cue: string
  exercises: ItemExercise[]
}

export type GymSessionId = 'haut-a' | 'bas-a' | 'haut-b' | 'bas-b' | 'full-x' | 'full-y' | 'mix-b'
export type HomeSessionId = 'maison-1' | 'maison-2' | 'maison-3'
export type SessionId = GymSessionId | HomeSessionId

/** 1 = séances salle, 2 = Maison 2, 3 = Maison 1, 4 = Maison 3 (la première à sauter). */
export type SessionPriority = 1 | 2 | 3 | 4

export interface Session {
  id: SessionId
  name: string
  focus: string
  location: Location
  priority: SessionPriority
  /** principale (salle), imprévu (secours salle) ou maison. */
  category: 'principale' | 'imprevu' | 'maison'
  duration: string
  /** RIR imposé (séances de secours, séances maison), sinon on suit le plan. */
  fixedRir?: string
  /** Échauffement propre à la séance (sinon l'échauffement salle standard). */
  warmup?: string[]
  /** Consignes générales affichées en tête de séance. */
  notes?: string[]
  /** Séance optionnelle, transformable en repos complet. */
  optional?: boolean
  items: SessionItem[]
}

export interface WeekDay {
  /** 1 = lundi … 7 = dimanche */
  weekday: number
  label: string
  sessionId: SessionId
  location: Location
  title: string
  detail: string
  duration: string
  optional?: boolean
}

export interface ProgramBlock {
  id: string
  name: string
  fromWeek: number
  toWeek: number
  deload: boolean
  goal: string
  /** Fourchette de reps imposée aux mouvements de base pendant ce bloc. */
  mainLiftReps?: { min: number; max: number }
}

export interface RirRule {
  fromWeek: number
  toWeek: number
  /** RIR cible des mouvements de base. */
  base: string
  /** RIR cible des isolations (dernière série). */
  isolation: string
  /** Valeur pré-remplie dans le mode séance. */
  defaultRir: number
  note: string
}
