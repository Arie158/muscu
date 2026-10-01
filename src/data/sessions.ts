import type { ItemExercise, Session, SessionId, SessionItem, Target } from './types'

const reps = (min: number, max: number = min): Target => ({ kind: 'reps', min, max })
const secs = (min: number, max: number = min): Target => ({ kind: 'duree', min, max })
const ex = (exerciseId: string, target: Target, perSide?: string): ItemExercise =>
  perSide ? { exerciseId, target, perSide } : { exerciseId, target }

export const WARMUP = [
  '5-8 min de vélo ou de marche.',
  '2 séries légères progressives sur le premier exercice.',
]
export const COOLDOWN_CARDIO = 'Cardio de fin de séance optionnel : 10-20 min de LISS.'
export const LOWER_MOBILITY = 'Mobilité 5 min après la séance : fléchisseurs de hanche et ischios.'

const hautA: Session = {
  id: 'haut-a',
  name: 'Haut A',
  focus: 'Force',
  category: 'principale',
  location: 'gym',
  priority: 1,
  duration: '1h15 – 1h30',
  items: [
    {
      id: 'ha-1', label: 'Développé couché haltères ou Smith', format: 'simple', sets: 4,
      rest: { min: 120, max: 180 }, restLabel: '2-3 min',
      cue: 'Omoplates serrées, pieds ancrés, descente en 2 s, coudes ~45°',
      exercises: [ex('developpe-couche', reps(6, 8))],
    },
    {
      id: 'ha-2', label: 'Tirage vertical (lat pulldown)', format: 'simple', sets: 4,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Poitrine sortie, tirer avec les coudes vers les hanches, pas d’élan',
      exercises: [ex('tirage-vertical', reps(8, 10))],
    },
    {
      id: 'ha-3', label: 'Développé incliné machine ou Smith', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Banc à 30°, barre vers le haut des pectoraux',
      exercises: [ex('developpe-incline-machine', reps(8, 10))],
    },
    {
      id: 'ha-4', label: 'Low row (rowing assis)', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Dos neutre, serrer les omoplates 1 s',
      exercises: [ex('low-row', reps(8, 10))],
    },
    {
      id: 'ha-5', label: 'Développé épaules machine convergente', format: 'simple', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Ne pas cambrer, s’arrêter avant le verrouillage',
      exercises: [ex('developpe-epaules-machine', reps(8, 10))],
    },
    {
      id: 'ha-6', label: 'Élévations latérales', format: 'simple', sets: 3,
      rest: { min: 60, max: 90 }, restLabel: '60-90 s',
      cue: 'Monter à l’horizontale, lent, sans balancer',
      exercises: [ex('elevations-laterales', reps(12, 15))],
    },
    {
      id: 'ha-7', label: 'Superset extension triceps poulie + curl poulie', format: 'superset', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s après le duo',
      cue: 'Coudes fixes, descente contrôlée',
      exercises: [ex('extension-triceps-poulie', reps(10, 12)), ex('curl-poulie', reps(10, 12))],
    },
  ],
}

const basA: Session = {
  id: 'bas-a',
  name: 'Bas A',
  focus: 'Quadriceps',
  category: 'principale',
  location: 'gym',
  priority: 1,
  duration: '1h15 – 1h30',
  items: [
    {
      id: 'ba-1', label: 'Squat Smith ou squat machine', format: 'simple', sets: 4,
      rest: { min: 120, max: 180 }, restLabel: '2-3 min',
      cue: 'Descendre au moins à la parallèle, genoux dans l’axe des pieds',
      exercises: [ex('squat-smith', reps(6, 8))],
    },
    {
      id: 'ba-2', label: 'Presse à cuisses', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Bassin collé au dossier, amplitude complète',
      exercises: [ex('presse-cuisses', reps(10, 12))],
    },
    {
      id: 'ba-3', label: 'Fentes marchées ou bulgares (haltères)', format: 'simple', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Buste droit, genou avant stable, poussée par le talon',
      exercises: [ex('fentes', reps(8, 10), 'jambe')],
    },
    {
      id: 'ba-4', label: 'Leg curl assis', format: 'simple', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Pause 1 s en contraction, retour lent',
      exercises: [ex('leg-curl-assis', reps(10, 12))],
    },
    {
      id: 'ba-5', label: 'Leg extension', format: 'simple', sets: 3,
      rest: { min: 60, max: 90 }, restLabel: '60-90 s',
      cue: 'Pause en haut, descente en 2-3 s',
      exercises: [ex('leg-extension', reps(12, 15))],
    },
    {
      id: 'ba-6', label: 'Mollets assis', format: 'simple', sets: 4,
      rest: { min: 60, max: 60 }, restLabel: '60 s',
      cue: 'Étirement complet, pause 1 s',
      exercises: [ex('mollets-assis', reps(10, 15))],
    },
    {
      id: 'ba-7', label: 'Planche + crunch poulie', format: 'circuit', sets: 3,
      rest: { min: 60, max: 60 }, restLabel: '60 s',
      cue: 'Planche 30-45 s, crunch 12-15 reps en enroulant le dos',
      exercises: [ex('planche', secs(30, 45)), ex('crunch-poulie', reps(12, 15))],
    },
  ],
}

const hautB: Session = {
  id: 'haut-b',
  name: 'Haut B',
  focus: 'Hypertrophie',
  category: 'principale',
  location: 'gym',
  priority: 1,
  duration: '1h15 – 1h30',
  items: [
    {
      id: 'hb-1', label: 'Tirage vertical prise neutre ou tractions assistées', format: 'simple', sets: 4,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Amplitude complète, bras tendus en haut',
      exercises: [ex('tirage-vertical-neutre', reps(8, 12))],
    },
    {
      id: 'hb-2', label: 'Développé incliné haltères', format: 'simple', sets: 4,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Banc à 30°, étirement en bas sans perdre la tension',
      exercises: [ex('developpe-incline-halteres', reps(8, 12))],
    },
    {
      id: 'hb-3', label: 'Rowing un bras haltère', format: 'simple', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Coude vers la hanche, sans pivoter le buste',
      exercises: [ex('rowing-un-bras', reps(10, 12), 'bras')],
    },
    {
      id: 'hb-4', label: 'Dips assistés', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Buste légèrement penché, coudes ~90° en bas (progression : réduire l’assistance vers 0)',
      exercises: [ex('dips-assistes', reps(8, 12))],
    },
    {
      id: 'hb-5', label: 'Pec deck ou écarté poulie', format: 'simple', sets: 3,
      rest: { min: 60, max: 90 }, restLabel: '60-90 s',
      cue: 'Coudes légèrement fléchis, serrer 1 s',
      exercises: [ex('pec-deck', reps(12, 15))],
    },
    {
      id: 'hb-6', label: 'Face pull', format: 'simple', sets: 3,
      rest: { min: 60, max: 60 }, restLabel: '60 s',
      cue: 'Tirer vers le visage, coudes hauts (bon pour la posture de bureau)',
      exercises: [ex('face-pull', reps(15, 15))],
    },
    {
      id: 'hb-7', label: 'Superset curl incliné haltères + extension triceps au-dessus de la tête', format: 'superset', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Lent, amplitude complète',
      exercises: [ex('curl-incline', reps(10, 15)), ex('extension-triceps-nuque', reps(10, 15))],
    },
  ],
}

const basB: Session = {
  id: 'bas-b',
  name: 'Bas B',
  focus: 'Chaîne postérieure',
  category: 'principale',
  location: 'gym',
  priority: 1,
  duration: '1h15 – 1h30',
  items: [
    {
      id: 'bb-1', label: 'Soulevé de terre roumain (barre ou haltères)', format: 'simple', sets: 4,
      rest: { min: 120, max: 180 }, restLabel: '2-3 min',
      cue: 'Dos neutre, hanches vers l’arrière, barre collée aux jambes',
      exercises: [ex('souleve-terre-roumain', reps(6, 8))],
    },
    {
      id: 'bb-2', label: 'Hip thrust machine ou glute trainer', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Menton rentré, bassin en rétroversion en haut, pause 1 s',
      exercises: [ex('hip-thrust', reps(8, 10))],
    },
    {
      id: 'bb-3', label: 'Presse pieds hauts ou hack squat', format: 'simple', sets: 3,
      rest: { min: 120, max: 120 }, restLabel: '2 min',
      cue: 'Pieds hauts et écartés pour cibler fessiers et ischios',
      exercises: [ex('presse-pieds-hauts', reps(10, 12))],
    },
    {
      id: 'bb-4', label: 'Leg curl allongé ou assis', format: 'simple', sets: 3,
      rest: { min: 90, max: 90 }, restLabel: '90 s',
      cue: 'Bassin plaqué, sans à-coups',
      exercises: [ex('leg-curl-allonge', reps(10, 12))],
    },
    {
      id: 'bb-5', label: 'Adducteurs (machine)', format: 'simple', sets: 3,
      rest: { min: 60, max: 90 }, restLabel: '60-90 s',
      cue: 'Contrôle sur toute l’amplitude',
      exercises: [ex('adducteurs', reps(12, 15))],
    },
    {
      id: 'bb-6', label: 'Mollets debout', format: 'simple', sets: 4,
      rest: { min: 60, max: 60 }, restLabel: '60 s',
      cue: 'Étirement complet, pause en haut',
      exercises: [ex('mollets-debout', reps(12, 15))],
    },
    {
      id: 'bb-7', label: 'Relevés de genoux + Pallof press', format: 'circuit', sets: 3,
      rest: { min: 60, max: 60 }, restLabel: '60 s',
      cue: '10-15 reps / 10 reps par côté',
      exercises: [ex('releves-genoux', reps(10, 15)), ex('pallof-press', reps(10, 10), 'côté')],
    },
  ],
}

// ─────────────── Séances de secours (imprévus / semaine chargée) ───────────────
const FB_REST = { min: 90, max: 120 }
const FB_REST_LABEL = '90 s – 2 min'

const fullX: Session = {
  id: 'full-x',
  name: 'Full body X',
  focus: 'Semaine chargée',
  category: 'imprevu',
  location: 'gym',
  priority: 1,
  duration: '45 – 50 min',
  fixedRir: 'RIR 1-2 sur tout',
  items: [
    { id: 'fx-1', label: 'Squat Smith', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Descendre au moins à la parallèle, genoux dans l’axe des pieds',
      exercises: [ex('squat-smith', reps(6, 8))] },
    { id: 'fx-2', label: 'Développé couché haltères', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Omoplates serrées, pieds ancrés, descente en 2 s, coudes ~45°',
      exercises: [ex('developpe-couche', reps(6, 8))] },
    { id: 'fx-3', label: 'Tirage vertical', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Poitrine sortie, tirer avec les coudes vers les hanches, pas d’élan',
      exercises: [ex('tirage-vertical', reps(8, 10))] },
    { id: 'fx-4', label: 'Leg curl', format: 'simple', sets: 2, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Pause 1 s en contraction, retour lent',
      exercises: [ex('leg-curl-assis', reps(10, 12))] },
    { id: 'fx-5', label: 'Superset élévations latérales + curl', format: 'superset', sets: 2, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Lent, sans balancer, coudes fixes',
      exercises: [ex('elevations-laterales', reps(12)), ex('curl-poulie', reps(12))] },
  ],
}

const fullY: Session = {
  id: 'full-y',
  name: 'Full body Y',
  focus: 'Semaine chargée',
  category: 'imprevu',
  location: 'gym',
  priority: 1,
  duration: '45 – 50 min',
  fixedRir: 'RIR 1-2 sur tout',
  items: [
    { id: 'fy-1', label: 'Soulevé de terre roumain', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Dos neutre, hanches vers l’arrière, barre collée aux jambes',
      exercises: [ex('souleve-terre-roumain', reps(6, 8))] },
    { id: 'fy-2', label: 'Développé incliné haltères', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Banc à 30°, étirement en bas sans perdre la tension',
      exercises: [ex('developpe-incline-halteres', reps(8, 10))] },
    { id: 'fy-3', label: 'Low row', format: 'simple', sets: 3, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Dos neutre, serrer les omoplates 1 s',
      exercises: [ex('low-row', reps(8, 10))] },
    { id: 'fy-4', label: 'Presse à cuisses', format: 'simple', sets: 2, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Bassin collé au dossier, amplitude complète',
      exercises: [ex('presse-cuisses', reps(10, 12))] },
    { id: 'fy-5', label: 'Superset dips assistés + face pull', format: 'superset', sets: 2, rest: FB_REST, restLabel: FB_REST_LABEL,
      cue: 'Buste légèrement penché sur les dips, coudes hauts sur le face pull',
      exercises: [ex('dips-assistes', reps(10, 15)), ex('face-pull', reps(10, 15))] },
  ],
}

/** Semaine à 3 séances : 3 premiers exercices du Haut B + 2 premiers du Bas B. */
const mixB: Session = {
  id: 'mix-b',
  name: 'Séance B mixte',
  focus: '3 séances dans la semaine',
  category: 'imprevu',
  location: 'gym',
  priority: 1,
  duration: '≈ 1h',
  items: [...hautB.items.slice(0, 3), ...basB.items.slice(0, 2)].map(
    (item): SessionItem => ({ ...item, id: `mx-${item.id}` }),
  ),
}

// ─────────────── Séances maison ───────────────
const mins = (min: number, max: number = min): Target => ({ kind: 'minutes', min, max })
const NO_REST = { min: 0, max: 0 }

const maison1: Session = {
  id: 'maison-1',
  name: 'Maison 1',
  focus: 'Récupération active et gainage',
  category: 'maison',
  location: 'home',
  priority: 3,
  duration: '35 – 40 min',
  fixedRir: 'RIR 3 en permanence',
  warmup: ['Le cardio doux sert d’échauffement.'],
  notes: ['Mouvements lents et sans douleur.', 'Dos neutre sur le gainage : ne jamais cambrer.'],
  items: [
    {
      id: 'm1-1', label: 'Cardio doux', format: 'activite', sets: 1, rest: NO_REST, restLabel: '—',
      cue: 'Marche rapide, vélo ou tapis, à un rythme où l’on peut parler',
      exercises: [ex('cardio-doux', mins(15, 20))],
    },
    {
      id: 'm1-2', label: 'Mobilité', format: 'circuit', sets: 1, rest: NO_REST, restLabel: '—',
      cue: 'Mouvements lents et sans douleur',
      exercises: [
        ex('cat-cow', reps(10)),
        { exerciseId: 'fente-basse', target: secs(30), perSide: 'côté', sets: 2 },
        ex('etirement-ischios', secs(30), 'côté'),
        ex('rotation-thoracique', reps(8), 'côté'),
        ex('hanches-90-90', reps(8), 'côté'),
        ex('etirement-pectoraux', secs(30), 'côté'),
      ],
    },
    {
      id: 'm1-3', label: 'Gainage', format: 'circuit', sets: 2, rest: { min: 45, max: 45 }, restLabel: '45 s',
      cue: 'Dos neutre, ne jamais cambrer',
      exercises: [
        ex('dead-bug', reps(10), 'côté'),
        ex('bird-dog', reps(10), 'côté'),
        ex('planche-laterale', secs(25, 35), 'côté'),
      ],
    },
    {
      // Repos non précisé par le programme : 45 s, comme le gainage.
      id: 'm1-4', label: 'Posture : face pull à l’élastique (ou Y-T-W au sol)', format: 'simple', sets: 2,
      rest: { min: 45, max: 45 }, restLabel: '45 s',
      cue: 'Épaules basses, serrer les omoplates 1 s',
      exercises: [ex('face-pull-elastique', reps(15))],
    },
  ],
}

const maison2: Session = {
  id: 'maison-2',
  name: 'Maison 2',
  focus: 'Conditionnement léger',
  category: 'maison',
  location: 'home',
  priority: 2,
  duration: '45 – 50 min',
  fixedRir: 'RIR 3 sur tout (jamais proche de l’échec)',
  warmup: ['5 min : marche sur place, rotations d’épaules, 1 série légère de pompes.'],
  notes: [
    'Squat volontairement léger : Bas B a eu lieu la veille.',
    'Pas de HIIT aujourd’hui.',
  ],
  items: [
    {
      id: 'm2-1', label: 'Circuit de renforcement', format: 'circuit', sets: 3, deloadSets: 2,
      rest: { min: 60, max: 90 }, restLabel: '60-90 s entre les tours',
      cue: 'RIR 3 : s’arrêter quand il reste 3 répétitions propres. Superset curl + triceps sur 2 tours seulement',
      exercises: [
        ex('pompes', reps(8, 15)),
        ex('rowing-maison', reps(12, 15)),
        ex('squat-gobelet', reps(12, 15)),
        ex('pont-fessier', reps(15)),
        ex('elevations-laterales-maison', reps(12, 15)),
        { exerciseId: 'curl-maison', target: reps(15), sets: 2 },
        { exerciseId: 'extension-triceps-maison', target: reps(15), sets: 2 },
        ex('planche', secs(30, 45)),
      ],
    },
    {
      id: 'm2-2', label: 'Finisher : LISS', format: 'activite', sets: 1, rest: NO_REST, restLabel: '—',
      cue: 'Marche rapide ou vélo, rythme où l’on peut parler',
      exercises: [ex('cardio-doux', mins(15, 20))],
    },
  ],
}

const maison3: Session = {
  id: 'maison-3',
  name: 'Maison 3',
  focus: 'Marche et mobilité',
  category: 'maison',
  location: 'home',
  priority: 4,
  duration: '25 – 30 min',
  optional: true,
  warmup: [],
  notes: ['Aucune série de travail : c’est un repos actif.', 'Optionnelle : transformable en repos complet.'],
  items: [
    {
      id: 'm3-1', label: 'Marche tranquille', format: 'activite', sets: 1, rest: NO_REST, restLabel: '—',
      cue: 'De préférence dehors',
      exercises: [ex('marche-tranquille', mins(20, 30))],
    },
    {
      id: 'm3-2', label: 'Mobilité (8-10 min)', format: 'circuit', sets: 1, rest: NO_REST, restLabel: '—',
      cue: 'Mouvements lents et sans douleur',
      exercises: [
        ex('cat-cow', reps(10)),
        ex('fente-basse', secs(30), 'côté'),
        ex('etirement-ischios', secs(30), 'côté'),
        ex('rotation-thoracique', reps(8), 'côté'),
      ],
    },
  ],
}

export const sessions: Session[] = [hautA, basA, hautB, basB, fullX, fullY, mixB, maison1, maison2, maison3]
/** Les 4 séances salle de la semaine type. */
export const mainSessions = sessions.filter((s) => s.category === 'principale')
export const homeSessions = sessions.filter((s) => s.location === 'home')
/** Ordre à respecter dans la semaine (salle). */
export const SESSION_ORDER: SessionId[] = ['haut-a', 'bas-a', 'haut-b', 'bas-b']

/**
 * Priorité, de la plus importante à la moins importante :
 * 1. les 4 séances salle (Bas A et Bas B d'abord) ; 2. Maison 2 ; 3. Maison 1 ; 4. Maison 3.
 * En cas de manque de temps ou d'énergie, on saute dans l'ordre inverse.
 */
export const PRIORITY_ORDER: SessionId[] = ['bas-a', 'bas-b', 'haut-a', 'haut-b', 'maison-2', 'maison-1', 'maison-3']

export const sessionsById = Object.fromEntries(sessions.map((s) => [s.id, s])) as Record<SessionId, Session>
