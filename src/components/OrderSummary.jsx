function OrderSummary({ order, onRemoveItem }) {
  return (
    <div>
      <h2>Deine Bestellung</h2>
      {order.length === 0 ? (
        <p>Noch nichts bestellt.</p>
      ) : (
        <ul>
          {order.map((item) => (
            <li key={item.orderId}>
              {item.name}
              <button type="button" onClick={() => onRemoveItem(item.orderId)}>
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrderSummary