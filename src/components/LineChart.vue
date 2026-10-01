<script setup lang="ts">
// Graphique en courbes (Chart.js chargé à la demande pour alléger le premier chargement).
// Couleurs : palette catégorielle validée (--series-1 bleu, --series-2 orange), légende dès 2 séries,
// infobulle au survol et tableau des données pour l'accessibilité.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { Chart as ChartType } from 'chart.js'
import { formatShort, toISODate } from '@/lib/dates'
import { useSettingsStore } from '@/stores/settings'

export interface Series {
  label: string
  points: { date: string; value: number }[]
  /** 'line' = courbe, 'dots' = points seuls (données brutes). */
  style?: 'line' | 'dots'
}

const props = withDefaults(defineProps<{ title: string; series: Series[]; unit: string; decimals?: number }>(), {
  decimals: 1,
})

const canvas = ref<HTMLCanvasElement | null>(null)
const chart = shallowRef<ChartType | null>(null)
const settings = useSettingsStore()

const hasData = computed(() => props.series.some((s) => s.points.length > 0))
const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: props.decimals })
const toTs = (iso: string) => new Date(`${iso}T12:00:00`).getTime()

const tableRows = computed(() => {
  const dates = [...new Set(props.series.flatMap((s) => s.points.map((p) => p.date)))].sort().reverse()
  return dates.map((d) => ({
    date: d,
    values: props.series.map((s) => s.points.find((p) => p.date === d)?.value ?? null),
  }))
})

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

async function render() {
  if (!canvas.value || !hasData.value) return
  const { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip, Legend } = await import('chart.js')
  Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend)
  chart.value?.destroy()

  const colors = [css('--series-1'), css('--series-2')]
  const text = css('--muted')
  const grid = css('--chart-grid')
  const surface = css('--surface')

  chart.value = new Chart(canvas.value, {
    type: 'line',
    data: {
      datasets: props.series.map((s, i) => {
        const color = colors[i % colors.length]!
        const dots = s.style === 'dots'
        return {
          label: s.label,
          data: s.points.map((p) => ({ x: toTs(p.date), y: p.value })),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          showLine: !dots,
          tension: 0.25,
          pointRadius: dots ? 4 : s.points.length > 12 ? 0 : 4,
          pointHoverRadius: 6,
          pointBorderColor: surface,
          pointBorderWidth: 2,
          order: dots ? 2 : 1,
        }
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 300 },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          border: { color: grid },
          ticks: { color: text, maxTicksLimit: 5, callback: (v) => formatShort(toISODate(new Date(Number(v)))) },
        },
        y: {
          grid: { color: grid },
          border: { display: false },
          ticks: { color: text, maxTicksLimit: 5, callback: (v) => fmt(Number(v)) },
        },
      },
      plugins: {
        legend: {
          display: props.series.length > 1,
          position: 'top',
          align: 'start',
          labels: { color: text, usePointStyle: true, boxWidth: 8, boxHeight: 8 },
        },
        tooltip: {
          callbacks: {
            title: (items) => (items[0] ? formatShort(toISODate(new Date(items[0].parsed.x ?? 0))) : ''),
            label: (item) => `${item.dataset.label} : ${fmt(item.parsed.y ?? 0)} ${props.unit}`,
          },
        },
      },
    },
  })
}

onMounted(render)
watch(() => [props.series, settings.settings.theme], render, { deep: true })
onBeforeUnmount(() => chart.value?.destroy())
</script>

<template>
  <figure class="chart">
    <figcaption class="eyebrow">{{ title }}</figcaption>
    <div v-if="hasData" class="canvas-wrap">
      <canvas ref="canvas" role="img" :aria-label="`${title} : graphique, données détaillées dans le tableau ci-dessous`" />
    </div>
    <p v-else class="muted small empty">Pas encore de données à afficher.</p>
    <details v-if="hasData" class="data">
      <summary>Voir les données</summary>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th v-for="s in series" :key="s.label" scope="col">{{ s.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in tableRows.slice(0, 60)" :key="r.date">
              <td>{{ formatShort(r.date) }}</td>
              <td v-for="(v, i) in r.values" :key="i" class="num">{{ v === null ? '—' : `${fmt(v)} ${unit}` }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>

<style scoped>
.chart { margin: 0; }
.canvas-wrap { position: relative; height: 220px; }
.empty { padding: 1.5rem 0; text-align: center; }
.data { margin-top: 0.5rem; }
.data summary { cursor: pointer; min-height: 40px; display: flex; align-items: center; font-weight: 600; color: var(--accent); }
</style>
