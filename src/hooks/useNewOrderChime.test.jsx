import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNewOrderChime } from './useNewOrderChime'

const order = (orderId) => ({ orderId, name: 'Gast', items: [], note: '' })

function setup(initial) {
  const play = vi.fn()
  const hook = renderHook((props) => useNewOrderChime({ play, ...props }), {
    initialProps: { orders: null, enabled: true, ...initial },
  })
  return { play, rerender: (props) => hook.rerender({ enabled: true, ...props }) }
}

describe('useNewOrderChime', () => {
  test('does not chime for the orders that are there when the bar opens', () => {
    const { play, rerender } = setup()

    rerender({ orders: [order('a'), order('b')] })

    expect(play).not.toHaveBeenCalled()
  })

  test('chimes once when a new order arrives', () => {
    const { play, rerender } = setup({ orders: [order('a')] })

    rerender({ orders: [order('a'), order('b')] })
    rerender({ orders: [order('a'), order('b')] })

    expect(play).toHaveBeenCalledTimes(1)
  })

  test('does not chime when orders are completed or cancelled', () => {
    const { play, rerender } = setup({ orders: [order('a'), order('b')] })

    rerender({ orders: [order('b')] })

    expect(play).not.toHaveBeenCalled()
  })

  test('stays quiet while switched off and does not catch up when switched on', () => {
    const { play, rerender } = setup({ orders: [order('a')], enabled: false })

    rerender({ orders: [order('a'), order('b')], enabled: false })
    rerender({ orders: [order('a'), order('b')], enabled: true })
    expect(play).not.toHaveBeenCalled()

    rerender({ orders: [order('a'), order('b'), order('c')] })
    expect(play).toHaveBeenCalledTimes(1)
  })
})
