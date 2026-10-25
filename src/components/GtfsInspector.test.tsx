import { fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GtfsInspector } from './GtfsInspector';
import { previewFiles } from '../test/gtfsFixture';

vi.mock('./MapPreview', () => ({
  MapPreview: ({
    importedStops,
    importedShapes,
  }: {
    importedStops: unknown[];
    importedShapes: unknown[];
  }) => (
    <div role="region" aria-label="Capas importadas">
      {importedStops.length} puntos · {importedShapes.length} trazados
    </div>
  ),
}));
function select(files = previewFiles) {
  fireEvent.change(screen.getByLabelText(/Elegir archivos GTFS/), {
    target: {
      files: Object.entries(files).map(([name, text]) => ({
        name,
        size: text.length,
        text: () => Promise.resolve(text),
      })),
    },
  });
}
describe('GTFS import and preview', () => {
  it('imports, filters routes and stops, shows related stops and clears all layers', async () => {
    render(<GtfsInspector />);
    select();
    await screen.findByRole('heading', { name: 'Vista previa del conjunto importado' });
    fireEvent.change(screen.getByLabelText(/Filtrar líneas/), { target: { value: 'test-a' } });
    expect(
      within(screen.getByRole('list', { name: 'Líneas importadas' })).getAllByRole('listitem'),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /TEST-A/ }));
    expect(
      within(screen.getByRole('list', { name: 'Paradas importadas' })).getAllByRole('listitem'),
    ).toHaveLength(2);
    fireEvent.change(screen.getByLabelText(/Filtrar paradas/), { target: { value: 's1' } });
    expect(
      within(screen.getByRole('list', { name: 'Paradas importadas' })).getAllByRole('listitem'),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar vista geográfica' }));
    expect(screen.getByRole('region', { name: 'Capas importadas' })).toHaveTextContent(
      '1 puntos · 1 trazados',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar importación' }));
    expect(screen.queryByRole('region', { name: 'Capas importadas' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Vista previa del conjunto importado' }),
    ).not.toBeInTheDocument();
  });
  it('explains empty results, invalid coordinates and unavailable geometries', async () => {
    render(<GtfsInspector />);
    select({ ...previewFiles, 'shapes.txt': '' });
    await screen.findByRole('heading', { name: 'Vista previa del conjunto importado' });
    fireEvent.change(screen.getByLabelText(/Filtrar paradas/), { target: { value: 's2' } });
    expect(screen.getByText(/Sin coordenadas válidas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar vista geográfica' }));
    expect(screen.getByText(/No se pueden representar paradas/)).toBeInTheDocument();
    expect(screen.getByText(/El trazado del recorrido no está disponible/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Filtrar paradas/), {
      target: { value: 'inexistente' },
    });
    expect(screen.getByText(/No hay paradas que coincidan/)).toBeInTheDocument();
  });
  it.each([
    [{ name: 'feed.zip', size: 1 }, /Elegí archivos .txt/],
    [{ name: 'stops.txt', size: 61 * 1024 * 1024 }, /supera los 60 MB/],
  ])('rejects unsupported or excessive selections', async (file, message) => {
    render(<GtfsInspector />);
    fireEvent.change(screen.getByLabelText(/Elegir archivos GTFS/), { target: { files: [file] } });
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });
  it('rejects duplicate file names and reports reading failures', async () => {
    render(<GtfsInspector />);
    const input = screen.getByLabelText(/Elegir archivos GTFS/);
    fireEvent.change(input, {
      target: {
        files: [
          { name: 'stops.txt', size: 1 },
          { name: 'STOPS.txt', size: 1 },
        ],
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/nombres repetidos/);
    fireEvent.change(input, {
      target: {
        files: [{ name: 'stops.txt', size: 1, text: () => Promise.reject(new Error('read')) }],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/No se pudieron leer o procesar/),
    );
  });
  it('ignores old reads after replacing or clearing the import', async () => {
    render(<GtfsInspector />);
    let resolve!: (text: string) => void;
    const pending = new Promise<string>((done) => {
      resolve = done;
    });
    fireEvent.change(screen.getByLabelText(/Elegir archivos GTFS/), {
      target: { files: [{ name: 'stops.txt', size: 1, text: () => pending }] },
    });
    select();
    await screen.findByText('TEST-A');
    await act(async () => resolve('stop_id,stop_name\nold,Obsolete'));
    expect(screen.getByText('TEST-A')).toBeInTheDocument();
    expect(screen.queryByText('Obsolete')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Elegir archivos GTFS/), {
      target: { files: [{ name: 'stops.txt', size: 1, text: () => pending }] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar importación' }));
    await act(async () => {});
    expect(
      screen.queryByRole('heading', { name: 'Vista previa del conjunto importado' }),
    ).not.toBeInTheDocument();
  });
});
