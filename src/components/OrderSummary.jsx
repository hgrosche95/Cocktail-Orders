function OrderSummary({ order, onRemoveItem }) {
  return (
    <div className="card">
      <h2>Deine Bestellung</h2>
      {order.length === 0 ? (
        <p>Noch nichts bestellt.</p>
      ) : (
        <ul className="order-items">
          {order.map((item) => (
            <li key={item.orderId} className="order-item">
              {item.name}
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => onRemoveItem(item.orderId)}
              >
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