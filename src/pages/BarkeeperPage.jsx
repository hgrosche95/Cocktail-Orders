function BarkeeperPage({ openOrders, onMarkAsDone }) {
  return (
    <div>
      <h2>Offene Bestellungen</h2>
      {openOrders.length === 0 ? (
        <p>Keine offenen Bestellungen.</p>
      ) : (
        <ul className="order-list">
          {openOrders.map((submittedOrder) => (
            <li key={submittedOrder.orderId} className="card barkeeper-order">
              <h3>{submittedOrder.name}</h3>
              <ul className="order-items">
                {submittedOrder.items.map((item) => (
                  <li key={item.orderId} className="order-item">
                    {item.name} - {item.description}
                  </li>
                ))}
              </ul>
              {submittedOrder.note && <p className="note">Anmerkung: {submittedOrder.note}</p>}
              <button
                type="button"
                className="btn btn-success btn-block"
                onClick={() => onMarkAsDone(submittedOrder.orderId)}
              >
                Erledigt
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BarkeeperPage