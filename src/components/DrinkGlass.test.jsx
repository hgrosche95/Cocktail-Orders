import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import DrinkGlass from './DrinkGlass'
import { glassKind, glassLayers } from '../data/glass'
import cocktails from '../data/cocktails'

const byName = (name) => cocktails.find((cocktail) => cocktail.name === name)

describe('glassKind', () => {
  test.each([
    ['Daiquiri', 'coupe'],
    ['Champagne Cocktail', 'flute'],
    ['French 75', 'flute'],
    ['Negroni', 'tumbler'],
    ['Old Fashioned', 'tumbler'],
    ['Mojito', 'highball'],
    ['Aperol Spritz', 'highball'],
  ])('%s kommt ins Glas %s', (name, kind) => {
    expect(glassKind(byName(name))).toBe(kind)
  })

  test('falls back to a coupe for a drink without recipe', () => {
    expect(glassKind({ name: 'Neu' })).toBe('coupe')
  })
})

describe('glassLayers', () => {
  test('shares follow the measured amounts and ignore extras like garnish', () => {
    const layers = glassLayers(byName('Cable Car'))

    expect(layers.map((layer) => layer.name)).toEqual(['Rum', 'Triple Sec', 'Zitronensaft', 'Zuckersirup'])
    expect(layers[0].share).toBeCloseTo(4.5 / 9.5)
    expect(layers.reduce((sum, layer) => sum + layer.share, 0)).toBeCloseTo(1)
  })

  test('fills the glass with one layer when nothing is measured', () => {
    expect(glassLayers({ name: 'Neu' })).toEqual([{ name: 'Neu', share: 1 }])
  })
})

describe('DrinkGlass', () => {
  test('draws one layer per measured ingredient and stays hidden from screen readers', () => {
    const { container } = render(<DrinkGlass cocktail={byName('Cable Car')} />)

    expect(container.querySelectorAll('.drink-glass-layer')).toHaveLength(4)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  test('shows ice cubes only for drinks served on ice', () => {
    const { container: onIce } = render(<DrinkGlass cocktail={byName('Negroni')} />)
    const { container: neat } = render(<DrinkGlass cocktail={byName('Daiquiri')} />)

    expect(onIce.querySelectorAll('.drink-glass-ice')).toHaveLength(2)
    expect(neat.querySelectorAll('.drink-glass-ice')).toHaveLength(0)
  })
})
