import CocktailList from '../components/CocktailList'
import OrderSummary from '../components/OrderSummary'
import OrderForm from '../components/OrderForm'

function CustomerPage({ order, onAddToOrder, onRemoveItem, onSubmitOrder, hasOpenOrder }) {
  return (
    <>
      <CocktailList order={order} onAddToOrder={onAddToOrder} />
      <OrderSummary order={order} onRemoveItem={onRemoveItem} />
      <OrderForm order={order} onSubmitOrder={onSubmitOrder} hasOpenOrder={hasOpenOrder} />
    </>
  )
}

export default CustomerPage