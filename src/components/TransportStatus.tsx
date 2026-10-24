const dataStatuses = [
  {
    title: 'Líneas y recorridos',
    status: 'Pendiente',
    detail: 'Fuentes por verificar',
  },
  {
    title: 'Horarios y llegadas',
    status: 'No conectados',
    detail: 'Sin horarios publicados en la app',
  },
  {
    title: 'Ubicación GPS',
    status: 'No conectada',
    detail: 'Sin seguimiento en vivo',
  },
];

export function TransportStatus() {
  return (
    <section className="data-status-panel" aria-labelledby="data-status-title">
      <div className="data-status-heading">
        <div>
          <p className="section-kicker">INFORMACIÓN VERIFICABLE</p>
          <h2 id="data-status-title">Conexiones de datos</h2>
        </div>
        <span className="subtle-label">Estado actual</span>
      </div>

      <ul className="data-status-grid">
        {dataStatuses.map((item) => (
          <li className="data-status-item" key={item.title}>
            <div className="data-status-item-top">
              <span className="availability-dot" aria-hidden="true" />
              <span className="data-status-value">{item.status}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>

      <p className="data-status-note">
        No mostramos recorridos, horarios, alertas ni ubicaciones inventadas para rellenar la pantalla.
      </p>
    </section>
  );
}
