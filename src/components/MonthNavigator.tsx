import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { currentMonth, formatMonthLabel, shiftMonth } from '../lib/date';

interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthNavigator({ month, onChange }: MonthNavigatorProps) {
  const isCurrent = month === currentMonth();

  return (
    <div className="month-nav" role="group" aria-label="Cambiar de mes">
      <button
        type="button"
        className="icon-btn icon-btn--sm"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mes anterior"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <span className="month-nav__label" aria-live="polite">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        className="icon-btn icon-btn--sm"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Mes siguiente"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
      {!isCurrent && (
        <button type="button" className="pill-btn" onClick={() => onChange(currentMonth())}>
          Hoy
        </button>
      )}
    </div>
  );
}
