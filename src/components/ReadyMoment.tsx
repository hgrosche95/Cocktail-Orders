import type { CSSProperties } from 'react'
import DrinkGlass from './DrinkGlass'
import { getCategoryTheme } from '../data/categories'
import type { OrderItem } from '../types'

interface ReadyMomentProps {
  item: OrderItem
  onClose: () => void
}

// Der Moment, auf den die ganze Warterei hinauslaeuft: sagt, welcher Drink
// fertig ist und wo er steht. Bewusst "X ist fertig" statt "Dein X": bei
// "Milch" oder "Margarita" waere "Dein" falsch.
function ReadyMoment({ item, onClose }: ReadyMomentProps) {
  return (
    <section
      className="ready-moment"
      style={{ '--cat-color': getCategoryTheme(item.category).color } as CSSProperties}
    >
      <div className="ready-moment-body">
        <DrinkGlass cocktail={item} />
        <div>
          <h2>{item.name} ist fertig</h2>
          <p>Steht für dich an der Theke.</p>
        </div>
      </div>
      <button type="button" className="btn btn-light btn-block" onClick={onClose}>
        Alles klar
      </button>
    </section>
  )
}

export default ReadyMoment
