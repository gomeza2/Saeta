import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('identifies the project as independent and avoids claiming real transport data', () => {
    const { getByRole, getByText } = render(<App />);

    expect(getByRole('heading', { name: /moverte por la ciudad/i })).toBeInTheDocument();
    expect(getByText(/no está afiliado ni representa una aplicación oficial/i)).toBeInTheDocument();
    expect(getByText(/aún no hay datos oficiales conectados/i)).toBeInTheDocument();
  });

  it('shows the technical foundation status', () => {
    const { getByRole, getByText } = render(<App />);

    expect(getByRole('heading', { name: /la base está en preparación/i })).toBeInTheDocument();
    expect(getByText('Preparada')).toBeInTheDocument();
    expect(getByText('Fase posterior')).toBeInTheDocument();
  });
});
