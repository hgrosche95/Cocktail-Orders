import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import RheinturmClock from './RheinturmClock'
import { clockDigits } from './rheinturmTime'

function litLampsPerGroup(container) {
  return [...container.querySelectorAll('.rheinturm-group')].map(
    (group) => group.querySelectorAll('.rheinturm-lamp.on').length
  )
}

describe('clockDigits', () => {
  test('splits the time into hour, minute and second digits', () => {
    expect(clockDigits(new Date(2026, 8, 24, 21, 58, 7))).toEqual([2, 1, 5, 8, 0, 7])
  })

  test('pads single-digit values with a leading zero', () => {
    expect(clockDigits(new Date(2026, 8, 24, 9, 5, 0))).toEqual([0, 9, 0, 5, 0, 0])
  })
})

describe('RheinturmClock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('lights as many lamps per group as the digit says', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 24, 21, 58, 7))

    const { container } = render(<RheinturmClock />)

    expect(litLampsPerGroup(container)).toEqual([2, 1, 5, 8, 0, 7])
    expect(screen.getByText('21:58:07')).toBeInTheDocument()
  })

  test('ticks forward every second', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 24, 21, 58, 59))

    const { container } = render(<RheinturmClock />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('21:59:00')).toBeInTheDocument()
    expect(litLampsPerGroup(container)).toEqual([2, 1, 5, 9, 0, 0])
  })
})
