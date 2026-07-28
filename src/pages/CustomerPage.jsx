import CocktailList from '../components/CocktailList'
import OrderSummary from '../components/OrderSummary'
import OrderForm from '../components/OrderForm'

function CustomerPage({
  order,
  onAddToOrder,
  onRemoveItem,
  onSubmitOrder,
  hasOpenOrder,
  orderFormRef,
  queueLength,
  unavailableIngredients,
}) {
  return (
    <>
      <p className="queue-counter">
        🍹 {queueLength} {queueLength === 1 ? 'Bestellung' : 'Bestellungen'} in der Warteschlange
      </p>
      <CocktailList
        order={order}
        onAddToOrder={onAddToOrder}
        unavailableIngredients={unavailableIngredients}
      />
      <OrderSummary order={order} onRemoveItem={onRemoveItem} />
      <div ref={orderFormRef}>
        <OrderForm order={order} onSubmitOrder={onSubmitOrder} hasOpenOrder={hasOpenOrder} />
      </div>
    </>
  )
}

export default CustomerPage