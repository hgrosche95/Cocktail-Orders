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
}) {
  return (
    <>
      <CocktailList order={order} onAddToOrder={onAddToOrder} />
      <OrderSummary order={order} onRemoveItem={onRemoveItem} />
      <div ref={orderFormRef}>
        <OrderForm order={order} onSubmitOrder={onSubmitOrder} hasOpenOrder={hasOpenOrder} />
      </div>
    </>
  )
}

export default CustomerPage