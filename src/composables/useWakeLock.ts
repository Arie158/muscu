import { onBeforeUnmount, onMounted } from 'vue'

/** Garde l'écran allumé pendant la séance (si le navigateur le permet). */
export function useWakeLock() {
  let lock: WakeLockSentinel | null = null

  async function request() {
    try {
      if ('wakeLock' in navigator && document.visibilityState === 'visible') {
        lock = await navigator.wakeLock.request('screen')
      }
    } catch {
      /* refusé ou non supporté */
    }
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') void request()
  }

  onMounted(() => {
    void request()
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisible)
    void lock?.release().catch(() => undefined)
  })
}
