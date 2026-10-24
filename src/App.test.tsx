import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('identifies the project as independent and avoids claiming real transport data', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /moverte por la ciudad/i })).toBeInTheDocument();
    expect(screen.getByText(/no está afiliado ni representa una aplicación oficial/i)).toBeInTheDocument();
    expect(screen.getByText(/aún no hay datos oficiales conectados/i)).toBeInTheDocument();
  });

  it('shows the technical foundation status', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /la base está en preparación/i })).toBeInTheDocument();
    expect(screen.getByText('Preparada')).toBeInTheDocument();
    expect(screen.getByText('Fase posterior')).toBeInTheDocument();
  });
});
