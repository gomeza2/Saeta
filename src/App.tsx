import { useState, type FormEvent } from 'react';
import { MapPreview } from './components/MapPreview';
import { GtfsInspector } from './components/GtfsInspector';
import { PrimaryNavigation } from './components/PrimaryNavigation';
import { StateNotice } from './components/StateNotice';
import type { AppView } from './types/app';
import { TransportStatus } from './components/TransportStatus';
import { appConfig } from './config/env';

const viewContent: Record<AppView, { eyebrow: string; title: string; description: string }> = {
  explore: {
    eyebrow: 'EXPLORAR',
    title: 'Explorá las opciones',
    description:
      'Buscá líneas o paradas cuando el catálogo de transporte esté verificado y disponible.',
  },
  planner: {
    eyebrow: 'PLANIFICACIÓN',
    title: 'Planificá un viaje',
    description:
      'Prepará los datos de origen y destino. Todavía no calculamos itinerarios ni transbordos reales.',
  },
  saved: {
    eyebrow: 'TUS PREFERENCIAS',
    title: 'Tus lugares guardados',
    description:
      'En próximas fases vas a poder guardar paradas y lugares cuando exista un catálogo verificado.',
  },
  data: {
    eyebrow: 'DATOS Y VALIDACIÓN',
    title: 'Revisá un conjunto de transporte',
    description:
      'Prepará y revisá archivos GTFS localmente. Filtrá líneas y paradas y abrí una vista geográfica opcional del conjunto importado.',
  },
  info: {
    eyebrow: 'TRANSPARENCIA',
    title: 'Estado de la información',
    description:
      'Consultá qué partes del producto están preparadas y qué servicios todavía no están conectados.',
  },
};

export function App() {
  const [activeView, setActiveView] = useState<AppView>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [plannerFeedback, setPlannerFeedback] = useState('');

  const content = viewContent[activeView];

  function changeView(view: AppView) {
    setActiveView(view);
    setSearchFeedback('');
    setPlannerFeedback('');
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchFeedback(
      searchQuery.trim()
        ? 'La búsqueda todavía no consulta un catálogo real. Las líneas y paradas se habilitarán cuando las fuentes estén verificadas.'
        : 'Escribí una línea o parada para probar el campo. La búsqueda real todavía no está conectada.',
    );
  }

  function handlePlannerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlannerFeedback(
      'No se generó un itinerario: las fuentes de líneas y recorridos aún no están conectadas. Lo que escribiste no se envió a ningún servicio.',
    );
  }

  return (
    <div className="app-frame" id="inicio">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label={appConfig.name + ', inicio'}>
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-copy">
            <span className="brand-wordmark">{appConfig.name}</span>
            <span className="brand-caption">Movilidad urbana · Salta</span>
          </span>
        </a>

        <div className="topbar-meta">
          <span className="status-pill">
            <span className="status-pill-dot" aria-hidden="true" />
            Sin datos conectados
          </span>
          <span className="city-label">Salta, Argentina</span>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-row" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="eyebrow">UNA INICIATIVA INDEPENDIENTE</p>
            <h1 id="welcome-title">Una forma más clara de moverte por Salta.</h1>
            <p className="welcome-description">
              Estamos construyendo una experiencia de movilidad más sencilla. Esta versión permite
              usar el mapa base y revisar archivos de transporte localmente. Todavía no consulta
              recorridos, horarios ni posiciones reales de SAETA.
            </p>
            <p className="independence-note">
              SAETA MAPS es un proyecto independiente. No es una aplicación oficial ni está afiliada
              a SAETA.
            </p>
          </div>
          <div className="phase-stamp" aria-label="Fase 6: vista previa local">
            <span className="phase-stamp-number">06</span>
            <span className="phase-stamp-copy">
              <strong>Fase actual</strong>
              <span>Vista previa local</span>
            </span>
          </div>
        </section>

        <PrimaryNavigation activeView={activeView} onChange={changeView} />

        <div className={activeView === 'data' ? 'workspace workspace-data' : 'workspace'}>
          <section className="action-panel" aria-labelledby="panel-title">
            <div className="action-panel-heading">
              <p className="section-kicker">{content.eyebrow}</p>
              <h2 id="panel-title">{content.title}</h2>
              <p>{content.description}</p>
            </div>

            {activeView === 'explore' && (
              <div className="explore-content">
                <form className="search-form" onSubmit={handleSearch}>
                  <label htmlFor="route-search">Línea o parada</label>
                  <div className="search-control">
                    <input
                      id="route-search"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Ej. línea o parada"
                      autoComplete="off"
                    />
                    <button className="primary-button" type="submit">
                      Buscar
                    </button>
                  </div>
                  <p className="field-hint">
                    El campo es interactivo, pero todavía no busca en datos de transporte.
                  </p>
                  {searchFeedback && (
                    <StateNotice kind="unavailable" title="Búsqueda no disponible todavía">
                      {searchFeedback}
                    </StateNotice>
                  )}
                </form>

                <div className="quick-actions">
                  <p className="section-kicker">ACCESOS RÁPIDOS</p>
                  <button
                    className="quick-action"
                    type="button"
                    onClick={() => changeView('planner')}
                  >
                    <span className="quick-action-icon" aria-hidden="true">
                      ↗
                    </span>
                    <span className="quick-action-copy">
                      <strong>Planificar un viaje</strong>
                      <span>Prepará un origen y destino</span>
                    </span>
                    <span className="quick-action-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                  <button
                    className="quick-action"
                    type="button"
                    onClick={() => changeView('saved')}
                  >
                    <span className="quick-action-icon" aria-hidden="true">
                      ☆
                    </span>
                    <span className="quick-action-copy">
                      <strong>Ver guardados</strong>
                      <span>Tu espacio personal, todavía vacío</span>
                    </span>
                    <span className="quick-action-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeView === 'planner' && (
              <form className="planner-form" onSubmit={handlePlannerSubmit}>
                <div className="form-field">
                  <label htmlFor="trip-origin">Origen</label>
                  <input
                    id="trip-origin"
                    type="text"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    placeholder="¿Desde dónde salís?"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="trip-destination">Destino</label>
                  <input
                    id="trip-destination"
                    type="text"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="¿A dónde querés ir?"
                    required
                  />
                </div>
                <button className="primary-button planner-submit" type="submit">
                  Consultar alternativas
                  <span aria-hidden="true">→</span>
                </button>
                <p className="field-hint">
                  En esta fase los campos funcionan solo en tu navegador: no se envían a un
                  servicio.
                </p>
                {plannerFeedback && (
                  <StateNotice kind="unavailable" title="Planificación no disponible todavía">
                    {plannerFeedback}
                  </StateNotice>
                )}
              </form>
            )}

            {activeView === 'saved' && (
              <div className="empty-state">
                <span className="empty-state-mark" aria-hidden="true">
                  ☆
                </span>
                <h3>Todavía no hay lugares guardados</h3>
                <p>
                  Los favoritos se habilitarán cuando incorporemos paradas y lugares verificados.
                  Esta pantalla no contiene datos de ejemplo.
                </p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => changeView('explore')}
                >
                  Volver a explorar
                </button>
              </div>
            )}

            {activeView === 'info' && (
              <div className="information-content">
                <div className="information-callout">
                  <span className="information-callout-mark" aria-hidden="true">
                    i
                  </span>
                  <p>
                    SAETA MAPS es un proyecto independiente. No es una aplicación oficial ni está
                    afiliada a SAETA.
                  </p>
                </div>
                <ul className="information-list">
                  <li>
                    <span>Datos de transporte</span>
                    <strong>Pendientes de verificación</strong>
                  </li>
                  <li>
                    <span>Mapa y ubicación</span>
                    <strong>Mapa base disponible; sin datos SAETA</strong>
                  </li>
                  <li>
                    <span>Horarios, alertas y recargas</span>
                    <strong>Aún sin integración</strong>
                  </li>
                </ul>
                <p className="field-hint">
                  No pedimos acceso a tu ubicación y no enviamos consultas a proveedores externos en
                  esta fase.
                </p>
              </div>
            )}
            <div hidden={activeView !== 'data'}>
              <GtfsInspector />
            </div>
          </section>

          <div className="visual-column" hidden={activeView === 'data'}>
            <MapPreview />
            <TransportStatus />
          </div>
        </div>

        <footer className="app-footer">
          <span className="footer-brand">SAETA MAPS</span>
          <span>Proyecto independiente · Salta, Argentina</span>
          <span>Sin recorridos ni posiciones simuladas</span>
        </footer>
      </main>
    </div>
  );
}
