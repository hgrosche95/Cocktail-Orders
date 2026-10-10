import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { connectLiveUpdates } from './liveUpdates'

// Minimaler WebSocket-Ersatz: die Tests steuern open/message/close selbst.
class FakeWebSocket extends EventTarget {
  static CONNECTING = 0
  static OPEN = 1
  static instances = []

  constructor(url) {
    super()
    this.url = url
    this.readyState = FakeWebSocket.CONNECTING
    this.close = vi.fn(() => this.serverClose())
    FakeWebSocket.instances.push(this)
  }

  serverOpen() {
    this.readyState = FakeWebSocket.OPEN
    this.dispatchEvent(new Event('open'))
  }

  serverMessage() {
    this.dispatchEvent(new Event('message'))
  }

  serverClose() {
    this.readyState = 3
    this.dispatchEvent(new Event('close'))
  }
}

function latestSocket() {
  return FakeWebSocket.instances.at(-1)
}

describe('connectLiveUpdates', () => {
  let onChange
  let onReconnect

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    FakeWebSocket.instances = []
    onChange = vi.fn()
    onReconnect = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('calls onChange for every server message', () => {
    connectLiveUpdates('ws://test', { onChange, onReconnect })
    latestSocket().serverOpen()

    latestSocket().serverMessage()
    latestSocket().serverMessage()

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onReconnect).not.toHaveBeenCalled()
  })

  test('reconnects after the connection drops and then refreshes once', () => {
    connectLiveUpdates('ws://test', { onChange, onReconnect })
    latestSocket().serverOpen()

    latestSocket().serverClose()
    expect(FakeWebSocket.instances).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(FakeWebSocket.instances).toHaveLength(2)

    latestSocket().serverOpen()
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  test('backs off exponentially while the server stays unreachable', () => {
    connectLiveUpdates('ws://test', { onChange, onReconnect })

    latestSocket().serverClose()
    vi.advanceTimersByTime(1000)
    expect(FakeWebSocket.instances).toHaveLength(2)

    latestSocket().serverClose()
    vi.advanceTimersByTime(1999)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3)
  })

  test('reconnects immediately when the tab becomes visible again', () => {
    connectLiveUpdates('ws://test', { onChange, onReconnect })
    latestSocket().serverOpen()
    latestSocket().serverClose()

    document.dispatchEvent(new Event('visibilitychange'))

    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  test('stops reconnecting after disconnect', () => {
    const disconnect = connectLiveUpdates('ws://test', { onChange, onReconnect })
    latestSocket().serverOpen()

    disconnect()
    vi.advanceTimersByTime(60_000)

    expect(latestSocket().close).toHaveBeenCalled()
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
