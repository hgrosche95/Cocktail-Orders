import { afterEach, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

// jsdom kennt kein Scrollen.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})
