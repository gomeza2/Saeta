import type { AppView } from '../App';

type PrimaryNavigationProps = {
  activeView: AppView;
  onChange: (view: AppView) => void;
};

const navigationItems: { id: AppView; label: string }[] = [
  { id: 'explore', label: 'Explorar' },
  { id: 'planner', label: 'Planificar' },
  { id: 'saved', label: 'Guardados' },
  { id: 'info', label: 'Información' },
];

export function PrimaryNavigation({ activeView, onChange }: PrimaryNavigationProps) {
  return (
    <nav className="primary-nav" aria-label="Secciones de SAETA MAPS">
      {navigationItems.map((item) => (
        <button
          className={activeView === item.id ? 'nav-button is-active' : 'nav-button'}
          type="button"
          key={item.id}
          aria-pressed={activeView === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
