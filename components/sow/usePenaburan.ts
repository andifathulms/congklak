'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Board } from '@/lib/engine/board'
import { describeEvent, type GameEvent } from '@/lib/engine/events'
import { framesFor, frameDuration, initialFrame, type Frame } from './frames'

export type Kecepatan = 'pelan' | 'sedang' | 'cepat' | 'langsung'

/** Long relays are unwatchable at full speed and incomprehensible at none. */
const PENGALI: Record<Kecepatan, number> = {
  pelan: 2,
  sedang: 1,
  cepat: 0.4,
  langsung: 0,
}

export const KECEPATAN: readonly Kecepatan[] = ['pelan', 'sedang', 'cepat', 'langsung']

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface Penaburan {
  readonly frame: Frame
  readonly playing: boolean
  /** Ringkasan tertulis peristiwa yang sudah lewat, untuk gerak-terbatas. */
  readonly ringkasan: readonly string[]
  play: (before: Board, events: readonly GameEvent[], onDone: () => void) => void
  /** Loncat ke akhir; animasi yang sedang jalan dibatalkan. */
  skip: () => void
  reset: (board: Board) => void
}

/**
 * Plays one turn's event stream. It decides only *when* to show a frame —
 * never *what* the frame contains.
 */
export function usePenaburan(board: Board, kecepatan: Kecepatan): Penaburan {
  const [frames, setFrames] = useState<Frame[]>(() => [initialFrame(board)])
  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef<(() => void) | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const finish = useCallback(() => {
    const callback = done.current
    done.current = null
    setPlaying(false)
    callback?.()
  }, [])

  useEffect(() => clear, [clear])

  // Satu langkah per bingkai, dijadwalkan dari durasi bingkai itu sendiri.
  useEffect(() => {
    if (!playing) return
    if (at >= frames.length - 1) {
      finish()
      return
    }

    const next = frames[at + 1]
    const ms = frameDuration(next) * PENGALI[kecepatan]

    if (ms <= 0) {
      setAt(frames.length - 1)
      return
    }

    timer.current = setTimeout(() => setAt((i) => i + 1), ms)
    return clear
  }, [playing, at, frames, kecepatan, clear, finish])

  const play = useCallback(
    (before: Board, events: readonly GameEvent[], onDone: () => void) => {
      clear()
      const next = framesFor(before, events)
      done.current = onDone
      setFrames(next)

      // Gerak-terbatas diselesaikan seketika, dengan ringkasan tertulis
      // tentang apa yang terjadi (PRD §8.1).
      if (prefersReducedMotion() || kecepatan === 'langsung') {
        setAt(next.length - 1)
        setPlaying(false)
        onDone()
        done.current = null
        return
      }

      setAt(0)
      setPlaying(true)
    },
    [clear, kecepatan],
  )

  const skip = useCallback(() => {
    clear()
    setAt(frames.length - 1)
  }, [clear, frames.length])

  const reset = useCallback(
    (next: Board) => {
      clear()
      done.current = null
      setFrames([initialFrame(next)])
      setAt(0)
      setPlaying(false)
    },
    [clear],
  )

  const ringkasan = useMemo(
    () =>
      frames
        .slice(1, at + 1)
        .map((f) => (f.event ? describeEvent(f.event) : ''))
        .filter(Boolean),
    [frames, at],
  )

  return { frame: frames[at] ?? frames[0], playing, ringkasan, play, skip, reset }
}
