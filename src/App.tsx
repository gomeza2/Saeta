import { appConfig } from './config/env';

type FoundationStatus = {
  title: string;
  description: string;
  state: 'ready' | 'pending';
  stateLabel: string;
};

const foundationStatuses: FoundationStatus[] = [
  {
    title: 'Base de la aplicación',
    description: 'React, TypeScript y Vite configurados para desarrollo web.',
    state: 'ready',
    stateLabel: 'Preparada',
  },
  {
    title: 'Fuentes de transporte',
    description: 'Aún no hay datos oficiales conectados ni horarios verificados.',
    state: 'pending',
    stateLabel: 'Pendiente',
  },
  {
    title: 'Mapa y ubicación',
    description: 'Se incorporarán después de evaluar el proveedor cartográfico.',
    state: 'pending',
    stateLabel: 'Fase posterior',
  },
];

export function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label={appConfig.name + ', inicio'}>
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-wordmark">{appConfig.name}</span>
        </a>
        <span className="environment-tag">Proyecto independiente</span>
      </header>

      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          MOVILIDAD URBANA · SALTA, ARGENTINA
        </p>
        <h1 id="hero-title">
          Moverte por la ciudad,
          <span> con más claridad.</span>
        </h1>
        <p className="hero-description">
          Estamos preparando una experiencia sencilla para explorar opciones de transporte y
          planificar viajes por Salta. La información real se incorporará únicamente cuando sus
          fuentes y condiciones de uso estén verificadas.
        </p>
        <div className="notice" role="status">
          <span className="notice-icon" aria-hidden="true">
            i
          </span>
          <p>
            <strong>Versión inicial de desarrollo.</strong> Este proyecto es independiente y no está
            afiliado ni representa una aplicación oficial de SAETA. Todavía no ofrece recorridos,
            horarios, ubicaciones de colectivos ni recargas reales.
          </p>
        </div>
      </section>

      <section className="foundation" aria-labelledby="foundation-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">ESTADO DEL PROYECTO</p>
            <h2 id="foundation-title">La base está en preparación</h2>
          </div>
          <span className="phase-pill">Fase 1 · Base técnica</span>
        </div>

        <ul className="status-list">
          {foundationStatuses.map((item, index) => (
            <li className="status-item" key={item.title}>
              <span className={'status-number ' + item.state} aria-hidden="true">
                {item.state === 'ready' ? '✓' : String(index + 1).padStart(2, '0')}
              </span>
              <div className="status-copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className={'status-label ' + item.state}>{item.stateLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        <span>SAETA MAPS</span>
        <span>Una iniciativa independiente para la movilidad en Salta.</span>
      </footer>
    </main>
  );
}
