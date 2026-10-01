import { onBeforeUnmount, ref, type Ref } from 'vue'

export function usePrefersReducedMotion(): Ref<boolean> {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const reduced = ref(mq?.matches ?? false)
  const onChange = (e: MediaQueryListEvent) => (reduced.value = e.matches)
  mq?.addEventListener('change', onChange)
  onBeforeUnmount(() => mq?.removeEventListener('change', onChange))
  return reduced
}
