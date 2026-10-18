/** Pause rendering while hidden; honor the system's reduced-motion preference. */
export function sceneLoop(draw: (time: number, reduced: boolean) => void): () => void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  let raf = 0
  let previous = -Infinity
  let stopped = false
  const tick = (time: number) => {
    if (stopped || document.hidden) return
    if (time - previous >= (media.matches ? 100 : 1000 / 60)) {
      draw(time, media.matches)
      previous = time
    }
    raf = requestAnimationFrame(tick)
  }
  const visibility = () => {
    cancelAnimationFrame(raf)
    previous = -Infinity
    if (!document.hidden && !stopped) raf = requestAnimationFrame(tick)
  }
  document.addEventListener('visibilitychange', visibility)
  visibility()
  return () => { stopped = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visibility) }
}
