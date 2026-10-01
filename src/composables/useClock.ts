import { ref, readonly } from 'vue'
import { todayISO } from '@/lib/dates'

// Date du jour partagée, rafraîchie chaque minute (l'app peut rester ouverte après minuit).
const today = ref(todayISO())
let started = false

export function useClock() {
  if (!started && typeof window !== 'undefined') {
    started = true
    window.setInterval(() => {
      const t = todayISO()
      if (t !== today.value) today.value = t
    }, 60_000)
  }
  return { today: readonly(today) }
}
