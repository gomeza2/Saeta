import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GtfsExplorer } from './GtfsExplorer';
import { buildGtfsPreview } from '../data/gtfsPreview';
import { previewFiles } from '../test/gtfsFixture';
vi.mock('./MapPreview', () => ({ MapPreview: () => <div>Mapa local</div> }));
describe('exploration of imported data', () => {
  it('filters routes and stops by ID or name without remote searches', () => {
    render(<GtfsExplorer data={buildGtfsPreview(previewFiles)} />);
    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'test-a' } });
    expect(
      within(screen.getByRole('list', { name: 'Resultados del conjunto local' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /TEST-A/ }));
    expect(screen.getByRole('heading', { name: 'Detalle de línea: TEST-A' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Paradas de la línea seleccionada' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(2);
    fireEvent.change(search, { target: { value: 's2' } });
    fireEvent.click(
      within(screen.getByRole('list', { name: 'Resultados del conjunto local' })).getByRole(
        'button',
      ),
    );
    expect(screen.getByText(/Sin coordenadas válidas para el mapa/)).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'desconocido' } });
    expect(screen.getByText(/No hay coincidencias/)).toBeInTheDocument();
    expect(screen.getByText(/No consulta una fuente remota/)).toBeInTheDocument();
  });
  it('explains absent entities and missing relations', () => {
    const { rerender } = render(
      <GtfsExplorer data={buildGtfsPreview({ 'routes.txt': previewFiles['routes.txt'] })} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /TEST-A/ }));
    expect(screen.getByText(/No hay relaciones comprobables/)).toBeInTheDocument();
    rerender(<GtfsExplorer data={{ routes: [], stops: [], shapes: [] }} />);
    expect(screen.getByText(/No hay coincidencias/)).toBeInTheDocument();
  });
});
