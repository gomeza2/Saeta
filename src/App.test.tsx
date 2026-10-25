import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { StateNotice } from './components/StateNotice';

describe('App', () => {
  it('identifies the project as independent and does not claim live transport data', () => {
    const { getByRole, getByText } = render(<App />);

    expect(
      getByRole('heading', { name: /una forma más clara de moverte por salta/i }),
    ).toBeInTheDocument();
    expect(getByText(/no es una aplicación oficial ni está afiliada a SAETA/i)).toBeInTheDocument();
    expect(getByText(/ni representa ubicaciones reales/i)).toBeInTheDocument();
  });

  it('navigates to the planner and clearly explains that no itinerary is generated', () => {
    const { getByRole, getByLabelText, getByText } = render(<App />);

    fireEvent.click(getByRole('button', { name: 'Planificar' }));
    expect(getByRole('heading', { name: 'Planificá un viaje' })).toBeInTheDocument();

    fireEvent.change(getByLabelText('Origen'), { target: { value: 'Centro' } });
    fireEvent.change(getByLabelText('Destino'), { target: { value: 'Universidad' } });
    fireEvent.click(getByRole('button', { name: /consultar alternativas/i }));

    expect(
      getByText(
        /no se generó un itinerario: las fuentes de líneas y recorridos aún no están conectadas/i,
      ),
    ).toBeInTheDocument();
  });

  it('keeps route searches transparent while transport data is unavailable', () => {
    const { getByRole, getByLabelText, getByText } = render(<App />);

    fireEvent.change(getByLabelText('Línea o parada'), { target: { value: '3A' } });
    fireEvent.click(getByRole('button', { name: 'Buscar' }));

    expect(getByRole('status', { name: 'Búsqueda no disponible todavía' })).toHaveTextContent(
      /todavía no consulta un catálogo real/i,
    );
    expect(
      getByText(/líneas y paradas se habilitarán cuando las fuentes estén verificadas/i),
    ).toBeInTheDocument();
  });

  it('shows verified data availability without inventing service status', () => {
    const { getByRole, getByText } = render(<App />);

    fireEvent.click(getByRole('button', { name: 'Información' }));
    expect(getByRole('heading', { name: 'Estado de la información' })).toBeInTheDocument();
    expect(getByText('Pendientes de verificación')).toBeInTheDocument();
    expect(getByText('Aún sin integración')).toBeInTheDocument();
  });

  it('provides accessible loading and error patterns for future services', () => {
    const { getByRole, rerender } = render(
      <StateNotice kind="loading" title="Cargando recorridos">
        Estamos consultando la fuente de transporte.
      </StateNotice>,
    );

    expect(getByRole('status')).toHaveTextContent('Cargando recorridos');
    expect(getByRole('status')).toHaveTextContent('Estamos consultando la fuente de transporte.');

    rerender(
      <StateNotice kind="error" title="No se pudo cargar">
        La fuente no respondió.
      </StateNotice>,
    );

    expect(getByRole('alert')).toHaveTextContent('No se pudo cargar');
    expect(getByRole('alert')).toHaveTextContent('La fuente no respondió.');
  });
  it('opens the local GTFS inspector without claiming a live connection', () => {
    const { getByRole, getByText } = render(<App />);

    fireEvent.click(getByRole('button', { name: 'Datos' }));
    expect(getByRole('heading', { name: 'Revisá un conjunto de transporte' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Revisar un conjunto GTFS' })).toBeInTheDocument();
    expect(getByText(/no se suben ni se guardan en un servidor/i)).toBeInTheDocument();
  });
});

it('shares the local import with Explore and removes it everywhere when cleared', async () => {
  const { previewFiles } = await import('./test/gtfsFixture');
  const { getByRole, getByLabelText, findByRole, queryByRole } = render(<App />);
  fireEvent.click(getByRole('button', { name: 'Datos' }));
  fireEvent.change(getByLabelText(/Elegir archivos GTFS/), {
    target: {
      files: Object.entries(previewFiles).map(([name, text]) => ({
        name,
        size: text.length,
        text: () => Promise.resolve(text),
      })),
    },
  });
  await findByRole('heading', { name: 'Vista previa del conjunto importado' });
  fireEvent.click(getByRole('button', { name: 'Explorar' }));
  expect(getByRole('heading', { name: 'Explorar el conjunto local' })).toBeInTheDocument();
  fireEvent.change(getByLabelText('Línea o parada del conjunto importado'), {
    target: { value: 'r1' },
  });
  expect(getByRole('button', { name: /TEST-A/ })).toBeInTheDocument();
  fireEvent.click(getByRole('button', { name: 'Datos' }));
  fireEvent.click(getByRole('button', { name: 'Limpiar importación' }));
  fireEvent.click(getByRole('button', { name: 'Explorar' }));
  expect(queryByRole('heading', { name: 'Explorar el conjunto local' })).not.toBeInTheDocument();
  expect(getByLabelText('Línea o parada')).toBeInTheDocument();
});
