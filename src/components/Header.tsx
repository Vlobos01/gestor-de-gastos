import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faMoon, faSun, faTags, faWallet } from '@fortawesome/free-solid-svg-icons';
import type { CurrencyCode } from '../types';
import type { Theme } from '../hooks/useTheme';
import { MonthNavigator } from './MonthNavigator';

interface HeaderProps {
  month: string;
  currency: CurrencyCode;
  theme: Theme;
  onMonthChange: (month: string) => void;
  onToggleTheme: () => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
}

export function Header({
  month,
  currency,
  theme,
  onMonthChange,
  onToggleTheme,
  onOpenCategories,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">
            <FontAwesomeIcon icon={faWallet} />
          </span>
          <div>
            <h1 className="brand__title">Gestor de gastos</h1>
            <p className="brand__subtitle">Ingresos, gastos y presupuestos · {currency}</p>
          </div>
        </div>

        <div className="header-actions">
          <MonthNavigator month={month} onChange={onMonthChange} />
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenCategories}
            title="Gestionar categorías"
            aria-label="Gestionar categorías"
          >
            <FontAwesomeIcon icon={faTags} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenSettings}
            title="Ajustes y datos"
            aria-label="Abrir ajustes"
          >
            <FontAwesomeIcon icon={faGear} />
          </button>
          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label="Cambiar tema"
          >
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
          </button>
        </div>
      </div>
    </header>
  );
}
