import { useEffect, useRef, type RefObject } from 'react'

/** Movement before drag mode (keeps taps/clicks on buttons working). */
const DRAG_ACTIVATE_PX = 12
const SWIPE_THRESHOLD_PX = 56
const MAX_VERTICAL_RATIO = 1.25

type Session = {
  pointerId: number
  x: number
  y: number
  dragging: boolean
}

/**
 * Horizontal swipe / drag: left → next, right → previous.
 * Clicks on buttons and links work until the pointer moves enough to count as a drag.
 */
export function useHorizontalSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  enabled = true
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)
  const session = useRef<Session | null>(null)

  const onSwipeLeftRef = useRef(onSwipeLeft)
  const onSwipeRightRef = useRef(onSwipeRight)
  onSwipeLeftRef.current = onSwipeLeft
  onSwipeRightRef.current = onSwipeRight

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const clearSession = () => {
      session.current = null
    }

    const blockNextClick = () => {
      const stopClick = (ev: MouseEvent) => {
        ev.preventDefault()
        ev.stopImmediatePropagation()
      }
      el.addEventListener('click', stopClick, { capture: true, once: true })
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      if (session.current) return

      session.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dragging: false,
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const s = session.current
      if (!s || e.pointerId !== s.pointerId) return

      const dx = e.clientX - s.x
      const dy = e.clientY - s.y

      if (s.dragging) return

      if (Math.abs(dx) > DRAG_ACTIVATE_PX && Math.abs(dx) > Math.abs(dy) * 0.8) {
        s.dragging = true
        el.setPointerCapture(e.pointerId)
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      const s = session.current
      if (!s || e.pointerId !== s.pointerId) return

      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      const wasDragging = s.dragging

      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      clearSession()

      if (!wasDragging) return

      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
      if (Math.abs(dx) < Math.abs(dy) * MAX_VERTICAL_RATIO) return

      blockNextClick()
      if (dx < 0) onSwipeLeftRef.current()
      else onSwipeRightRef.current()
    }

    const onPointerCancel = (e: PointerEvent) => {
      const s = session.current
      if (!s || e.pointerId !== s.pointerId) return
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      clearSession()
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [enabled])

  return ref
}
