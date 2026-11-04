import { useId } from 'react'
import { glassKind, glassLayers } from '../data/glass'
import type { GlassKind } from '../data/glass'
import type { Cocktail } from '../data/cocktails'

interface GlassShape {
  bowl: string
  liquidTop: number
  liquidBottom: number
  stem?: string
}

const STEM = 'M20 32V46M13 46.5H27'

const GLASS_SHAPES: Record<GlassKind, GlassShape> = {
  coupe: {
    bowl: 'M6 9H34C34 21 28 27 20 27C12 27 6 21 6 9Z',
    liquidTop: 13,
    liquidBottom: 27,
    stem: 'M20 27V46M12 46.5H28',
  },
  flute: {
    bowl: 'M14 4H26L25.2 25C25 29.5 23 32 20 32C17 32 15 29.5 14.8 25Z',
    liquidTop: 9,
    liquidBottom: 32,
    stem: STEM,
  },
  tumbler: {
    bowl: 'M8 18H32L30 47H10Z',
    liquidTop: 23,
    liquidBottom: 47,
  },
  highball: {
    bowl: 'M10 5H30L28.4 47H11.6Z',
    liquidTop: 10,
    liquidBottom: 47,
  },
}

// Benachbarte Schichten muessen sich unterscheiden, der Farbton selbst kommt
// von der Kategorie (--cat-color).
const LAYER_OPACITIES = [1, 0.6, 0.82, 0.45, 0.7, 0.55]

interface DrinkGlassProps {
  cocktail: Cocktail
}

// Das Rezept als Glas: jede gemessene Zutat ist eine Schicht, so hoch wie ihr
// Anteil. Reine Illustration - Name und Zutaten stehen immer auch als Text da.
function DrinkGlass({ cocktail }: DrinkGlassProps) {
  const clipId = useId()
  const shape = GLASS_SHAPES[glassKind(cocktail)]
  const liquidHeight = shape.liquidBottom - shape.liquidTop
  const hasIce = cocktail.recipe?.servedWithIceCubes ?? false

  // Von unten nach oben stapeln: jede Schicht beginnt ueber den bisherigen.
  const layers = glassLayers(cocktail)
  const shareBelow = (index: number) =>
    layers.slice(0, index + 1).reduce((sum, layer) => sum + layer.share, 0)

  return (
    <svg className="drink-glass" viewBox="0 0 40 52" aria-hidden="true" focusable="false">
      <clipPath id={clipId}>
        <path d={shape.bowl} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {layers.map((layer, index) => (
          <rect
            key={layer.name}
            className="drink-glass-layer"
            x="0"
            y={shape.liquidBottom - shareBelow(index) * liquidHeight}
            width="40"
            height={layer.share * liquidHeight}
            fillOpacity={LAYER_OPACITIES[index % LAYER_OPACITIES.length]}
          />
        ))}
        {hasIce && (
          <>
            <rect className="drink-glass-ice" x="15" y={shape.liquidTop + 3} width="7" height="7" rx="1.5" />
            <rect className="drink-glass-ice" x="20" y={shape.liquidTop + 9} width="7" height="7" rx="1.5" />
          </>
        )}
      </g>
      <path className="drink-glass-outline" d={shape.bowl} />
      {shape.stem && <path className="drink-glass-outline" d={shape.stem} />}
    </svg>
  )
}

export default DrinkGlass
