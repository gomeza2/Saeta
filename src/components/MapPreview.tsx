export function MapPreview() {
  return (
    <section className="map-preview" aria-labelledby="map-preview-title">
      <div className="map-preview-heading">
        <div>
          <p className="section-kicker">ESPACIO CARTOGRÁFICO</p>
          <h2 id="map-preview-title">Vista del mapa</h2>
        </div>
        <span className="phase-tag">Fase 3</span>
      </div>

      <div className="map-canvas">
        <div className="map-placeholder-content">
          <div className="map-placeholder-mark" aria-hidden="true">
            S
          </div>
          <p className="section-kicker">CARTOGRAFÍA PENDIENTE</p>
          <h3>El mapa interactivo viene después</h3>
          <p>
            Este espacio todavía no contiene calles, paradas ni posiciones de colectivos reales.
          </p>
        </div>
      </div>

      <p className="map-disclaimer">
        <span className="availability-dot" aria-hidden="true" />
        No es un mapa operativo ni representa ubicaciones reales.
      </p>
    </section>
  );
}
