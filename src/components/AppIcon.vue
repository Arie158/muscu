<script lang="ts">
// Icônes SVG inline (trait 2 px, grille 24×24), décoratives par défaut.
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
  dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  sun: 'M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h4v16H7zM14 4h4v16h-4z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 12.5 9.5 18 20 6',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  alert: 'M12 3 2 20h20L12 3zM12 10v4M12 17.5v.5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5V8',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  upload: 'M12 21V9M7 14l5-5 5 5M4 4h16',
  steps: 'M8 14c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5zM6 17h4v3H6zM16 11c2 0 3-2 3-5s-1-4-3-4-3 2-3 4 1 5 3 5zM14 14h4v3h-4z',
  food: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 7h3v11',
  heart: 'M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  close: 'M6 6l12 12M18 6 6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  book: 'M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  upper: 'M8 4h8l3 5-3 2v9H8v-9L5 9zM9.5 4a2.5 2.5 0 0 0 5 0',
  lower: 'M8 3h8v6l-1 12h-3l-1-9-1 9H7L6 9V3',
  core: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
} as const

export type IconName = keyof typeof PATHS
export { PATHS }
</script>

<script setup lang="ts">
const props = defineProps<{ name: IconName; label?: string; size?: number }>()
</script>

<template>
  <svg
    :width="props.size ?? 22"
    :height="props.size ?? 22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="PATHS[props.name]" />
  </svg>
</template>
