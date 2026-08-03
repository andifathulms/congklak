/**
 * Animation replays the event stream. The renderer never computes an
 * outcome (invariant 17).
 *
 * Every frame below is produced by applying one event's own stated numbers
 * to the previous frame. Nothing here knows a rule — it does not know what
 * menembak means, only that the event says these two holes go to zero and
 * the lumbung now reads this.
 */
import { BOARD_SIZE, lumbungOf, type Board } from '@/lib/engine/board'
import type { GameEvent } from '@/lib/engine/events'

export type Highlight = 'none' | 'scoop' | 'sow' | 'bank' | 'relay' | 'menembak' | 'sweep'

export interface Frame {
  /** Isi tiap posisi saat bingkai ini digambar. */
  readonly cells: readonly number[]
  /** Biji yang sedang di tangan. */
  readonly hand: number
  /** Posisi yang sedang disorot, atau null. */
  readonly active: number | null
  /** Posisi kedua — hanya lubang seberang saat menembak. */
  readonly secondary: number | null
  readonly highlight: Highlight
  /** Event yang menghasilkan bingkai ini; null untuk bingkai awal. */
  readonly event: GameEvent | null
}

export function initialFrame(board: Board): Frame {
  return {
    cells: Array.from(board),
    hand: 0,
    active: null,
    secondary: null,
    highlight: 'none',
    event: null,
  }
}

function applyEvent(prev: Frame, event: GameEvent): Frame {
  const cells = [...prev.cells]

  switch (event.type) {
    case 'scoop':
      cells[event.index] = 0
      return { cells, hand: event.biji, active: event.index, secondary: null, highlight: 'scoop', event }

    case 'sow':
      cells[event.index] = event.biji
      return { cells, hand: event.sisa, active: event.index, secondary: null, highlight: 'sow', event }

    case 'bank':
      cells[event.index] = event.biji
      return { cells, hand: event.sisa, active: event.index, secondary: null, highlight: 'bank', event }

    case 'relay':
      cells[event.index] = 0
      return { cells, hand: event.biji, active: event.index, secondary: null, highlight: 'relay', event }

    case 'menembak': {
      const lumbung = lumbungOf(event.player)
      cells[event.lubang] = 0
      cells[event.seberang] = 0
      cells[lumbung] = event.lumbung
      return {
        cells,
        hand: 0,
        active: event.lubang,
        secondary: event.seberang,
        highlight: 'menembak',
        event,
      }
    }

    case 'sweep':
      cells[event.from] = 0
      if (event.to !== null) cells[event.to] += event.biji
      return {
        cells,
        hand: 0,
        active: event.to,
        secondary: event.from,
        highlight: 'sweep',
        event,
      }

    case 'extraTurn':
      return { ...prev, cells, hand: 0, active: lumbungOf(event.player), secondary: null, highlight: 'bank', event }

    case 'turnEnd':
    case 'end':
      return { cells, hand: 0, active: null, secondary: null, highlight: 'none', event }

    default: {
      const never: never = event
      return never
    }
  }
}

/**
 * The full frame sequence for one turn, starting from the board as it was
 * before the move. Index 0 is the pre-move board.
 */
export function framesFor(before: Board, events: readonly GameEvent[]): Frame[] {
  const frames: Frame[] = [initialFrame(before)]
  for (const event of events) {
    frames.push(applyEvent(frames[frames.length - 1], event))
  }
  return frames
}

/** How long a frame should sit on screen, before the speed multiplier. */
export function frameDuration(frame: Frame): number {
  switch (frame.highlight) {
    case 'none':
      return 0
    case 'sow':
      return 110
    case 'bank':
      return 190 // jatuh ke lumbung terasa lebih berat
    case 'scoop':
    case 'relay':
      return 300 // angkatan harus terlihat, itu inti permainannya
    case 'menembak':
      return 650
    case 'sweep':
      return 220
    default: {
      const never: never = frame.highlight
      return never
    }
  }
}

export function assertFrameWidth(frame: Frame): void {
  if (frame.cells.length !== BOARD_SIZE) {
    throw new Error(`bingkai punya ${frame.cells.length} posisi, seharusnya ${BOARD_SIZE}`)
  }
}
