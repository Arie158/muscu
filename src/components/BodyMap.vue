<script setup lang="ts">
// Silhouette face / dos où les parties du corps travaillées sont colorées :
// ciblées en plein, sollicitées en léger. Dessin maison (SVG), une moitié de corps
// tracée puis reproduite en miroir.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ primary: string[]; secondary?: string[]; size?: 'sm' | 'md' }>(),
  { secondary: () => [], size: 'md' },
)

type View = 'face' | 'dos'
interface Shape { part: string; view: View; d: string }

// Moitié gauche (à l'écran) de chaque silhouette, axe de symétrie x = 50.
const SHAPES: Shape[] = [
  // Face
  { part: 'Trapèzes', view: 'face', d: 'M45 27 L39 32 L45 32 Z' },
  { part: 'Épaules', view: 'face', d: 'M39 32 C31 31 26 37 26 46 L33 46 C33 40 36 36 41 34 Z' },
  { part: 'Pectoraux', view: 'face', d: 'M50 34 L42 34 C36 37 34 43 34.5 50 C40 54 46 53 50 52 Z' },
  { part: 'Biceps', view: 'face', d: 'M26 48 C24 55 24 63 25.5 70 L31.5 70 C33 62 33.5 55 33 48 Z' },
  { part: 'Avant-bras', view: 'face', d: 'M25.5 72 C23 81 22 90 23 99 L27.5 99 C29.5 90 31.5 81 31.5 72 Z' },
  { part: 'Abdos', view: 'face', d: 'M43 55 L49.3 55 L49.3 90 L43.5 90 C42 78 42 66 43 55 Z' },
  { part: 'Abdos', view: 'face', d: 'M35 53 C36.5 64 38 78 40 90 L42.3 90 C40.8 78 40.8 66 41.8 55 Z' },
  { part: 'Hanches', view: 'face', d: 'M40 92 L49.3 92 L49.3 100 L44 104 C42 99 40.5 95 40 92 Z' },
  { part: 'Quadriceps', view: 'face', d: 'M38.5 94 C33.5 108 33.5 128 37 146 L44.5 146 C44.5 132 43.5 118 43 106 Z' },
  { part: 'Adducteurs', view: 'face', d: 'M44.3 106 L49.3 102 C49 116 48 130 46 144 C45.4 130 44.8 118 44.3 106 Z' },
  { part: 'Mollets', view: 'face', d: 'M37 155 C35 165 35.5 176 37.5 186 L40 186 C39.5 176 39.5 165 40 155 Z' },
  // Dos
  { part: 'Trapèzes', view: 'dos', d: 'M50 25 L45 27 L39 32 L50 50 Z' },
  { part: 'Épaules', view: 'dos', d: 'M39 32 C31 31 26 37 26 46 L33 46 C33 40 35 36 38.5 34 Z' },
  { part: 'Dos', view: 'dos', d: 'M38 35 L49.3 52 L49.3 59 C45 62 41.5 67 39 75 C35.5 64 34 49 38 35 Z' },
  { part: 'Lombaires', view: 'dos', d: 'M49.3 61 L49.3 89 L41.5 89 C41 81 41.5 73 43.5 67 Z' },
  { part: 'Triceps', view: 'dos', d: 'M26 48 C24 55 24 63 25.5 70 L31.5 70 C33 62 33.5 55 33 48 Z' },
  { part: 'Avant-bras', view: 'dos', d: 'M25.5 72 C23 81 22 90 23 99 L27.5 99 C29.5 90 31.5 81 31.5 72 Z' },
  { part: 'Fessiers', view: 'dos', d: 'M39.5 91 C35 97 35 108 38.5 114 C43 117 47.5 116.5 49.3 114.5 L49.3 91 Z' },
  { part: 'Ischio-jambiers', view: 'dos', d: 'M37.5 117 C34.5 128 35 138 37.5 146 L45.5 146 C46.5 136 48 126 49 117 C45 119 41 119 37.5 117 Z' },
  { part: 'Mollets', view: 'dos', d: 'M37.5 154 C33.5 163 34 175 38 184 L45 184 C47.5 175 47.5 163 45.5 154 Z' },
]

// Parties sans muscle coloriable (tête, mains, genoux, pieds…).
const NEUTRAL: Record<View, string[]> = {
  face: [
    'M45 24 L45 30 L50 31 L50 24 Z',
    'M23 101 C21.5 104 22 109 25 110 C28 109 28.5 104 27.5 101 Z',
    'M37 147 C36 151 37 154 40 154.5 C43 154 45 151 44.5 147 Z',
    'M40.5 156 C41 166 43 176 44.5 186 L45 156 Z',
    'M37.5 188 L44.5 188 L45 199 C42 202 37 202 36 199 Z',
  ],
  dos: [
    'M45 24 L45 27 L50 25 L50 24 Z',
    'M23 101 C21.5 104 22 109 25 110 C28 109 28.5 104 27.5 101 Z',
    'M37.5 147 C36.5 150 37 153 38 153 L45 153 C45.5 151 45.5 149 45.5 147 Z',
    'M39 186 L44.5 186 L44 197 L39.5 197 Z',
    'M38.5 199 L44.5 199 C45.5 201 44 203 41 203 C38.5 203 37.5 201 38.5 199 Z',
  ],
}

// « Jambes » = toute la jambe.
const EXPAND: Record<string, string[]> = {
  Jambes: ['Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Adducteurs', 'Mollets'],
}
const expand = (labels: string[]) => new Set(labels.flatMap((l) => EXPAND[l] ?? [l]))

const primarySet = computed(() => expand(props.primary))
const secondarySet = computed(() => expand(props.secondary))
const state = (part: string) => (primarySet.value.has(part) ? 'on' : secondarySet.value.has(part) ? 'half' : 'off')
const mapped = new Set(SHAPES.map((s) => s.part))
const visible = computed(() => [...primarySet.value].some((p) => mapped.has(p)))

const label = computed(() => {
  const s = props.secondary.length ? ` ; sollicite aussi : ${props.secondary.join(', ')}` : ''
  return `Schéma du corps. Travaille : ${props.primary.join(', ')}${s}`
})
const views: { id: View; title: string }[] = [
  { id: 'face', title: 'Face' },
  { id: 'dos', title: 'Dos' },
]
</script>

<template>
  <figure v-if="visible" class="bodymap" :class="size">
    <div class="figures" role="img" :aria-label="label">
      <div v-for="v in views" :key="v.id" class="fig">
        <svg viewBox="18 0 64 206" aria-hidden="true">
          <ellipse class="neutral" cx="50" cy="13" rx="8.5" ry="10.5" />
          <g v-for="mirror in [false, true]" :key="String(mirror)" :transform="mirror ? 'translate(100 0) scale(-1 1)' : undefined">
            <path v-for="(d, i) in NEUTRAL[v.id]" :key="`n${i}`" class="neutral" :d="d" />
            <path
              v-for="(s, i) in SHAPES.filter((x) => x.view === v.id)"
              :key="i"
              :class="['muscle', state(s.part)]"
              :d="s.d"
            />
          </g>
        </svg>
        <span class="caption">{{ v.title }}</span>
      </div>
    </div>
    <figcaption v-if="size === 'md'" class="legend small muted">
      <span><i class="sw on" aria-hidden="true" /> Ciblé</span>
      <span v-if="secondary.length"><i class="sw half" aria-hidden="true" /> Sollicité</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.bodymap { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
.figures { display: flex; gap: 0.75rem; justify-content: center; }
.fig { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
.md svg { width: 92px; height: auto; }
.sm svg { width: 64px; height: auto; }
.caption { font-size: 0.72rem; color: var(--muted); font-weight: 600; }
.sm .caption { font-size: 0.65rem; }
svg path, svg ellipse { stroke: var(--surface); stroke-width: 0.6; stroke-linejoin: round; }
.neutral, .muscle.off { fill: color-mix(in srgb, var(--muted) 24%, transparent); }
.neutral { fill: color-mix(in srgb, var(--muted) 14%, transparent); }
.muscle { transition: fill 0.2s; }
.muscle.on { fill: var(--accent); }
.muscle.half { fill: var(--accent); fill-opacity: 0.35; }
.legend { display: flex; gap: 0.9rem; }
.legend span { display: inline-flex; align-items: center; gap: 0.3rem; }
.sw { display: inline-block; width: 0.7rem; height: 0.7rem; border-radius: 3px; background: var(--accent); }
.sw.half { opacity: 0.35; }
</style>
