function BarkeeperPage({ openOrders, onMarkAsDone }) {
  return (
    <div>
      <h2>Offene Bestellungen</h2>
      {openOrders.length === 0 ? (
        <p>Keine offenen Bestellungen.</p>
      ) : (
        <ul>
          {openOrders.map((submittedOrder) => (
            <li key={submittedOrder.orderId}>
              <strong>{submittedOrder.name}</strong>
              <ul>
                {submittedOrder.items.map((item) => (
                  <li key={item.orderId}>{item.name} - {item.description}</li>
                ))}
              </ul>
              {submittedOrder.note && <p>Anmerkung: {submittedOrder.note}</p>}
              <button type="button" onClick={() => onMarkAsDone(submittedOrder.orderId)}>
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