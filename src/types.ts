import type { Cocktail } from './data/cocktails'

export interface OrderItem extends Cocktail {
  orderId: string
}

export interface SubmittedOrder {
  orderId: string
  name: string
  items: OrderItem[]
  note: string
}
