import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GtfsPlanner } from './GtfsPlanner';
import { buildGtfsPreview } from '../data/gtfsPreview';
import { scheduleFiles } from '../test/gtfsScheduleFixture';

describe('local schedule query', () => {
  it('shows published direct times and clears obsolete results on input changes', () => {
    render(<GtfsPlanner data={buildGtfsPreview(scheduleFiles)} />);
    fireEvent.change(screen.getByLabelText('Origen (ID de parada)'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Destino (ID de parada)'), { target: { value: 's2' } });
    fireEvent.change(screen.getByLabelText('Fecha de servicio'), {
      target: { value: '2026-10-25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar horarios publicados' }));
    expect(
      screen.getByText('Salida publicada: 25:00:00 · Llegada publicada: 25:20:00'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Destino (ID de parada)'), {
      target: { value: 'unknown' },
    });
    expect(screen.queryByText(/Salida publicada:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar horarios publicados' }));
    expect(screen.getByRole('status')).toHaveTextContent(/paradas existentes/);
  });
  it('explains why an insufficient import cannot generate journeys', () => {
    render(<GtfsPlanner data={buildGtfsPreview({})} />);
    expect(screen.getByRole('status')).toHaveTextContent(/zona horaria/);
    expect(
      screen.queryByRole('button', { name: 'Consultar horarios publicados' }),
    ).not.toBeInTheDocument();
  });
});
