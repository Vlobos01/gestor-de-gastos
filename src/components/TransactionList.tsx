import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faPen,
  faReceipt,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState, type CSSProperties } from 'react';
import type { Category, CurrencyCode, Transaction, TxType } from '../types';
import { UNKNOWN_CATEGORY, categoryByIdMap } from '../lib/calculations';
import { formatDayLabel } from '../lib/date';
import { formatCurrency } from '../lib/format';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyCode;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

type TypeFilter = 'all' | TxType;

export function TransactionList({
  transactions,
  categories,
  currency,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [query, setQuery] = useState('');

  const categoriesById = useMemo(() => categoryByIdMap(categories), [categories]);

  const filteredCategories = useMemo(
    () =>
      categories
        .filter((category) => typeFilter === 'all' || category.type === typeFilter)
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [categories, typeFilter],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...transactions]
      .filter((tx) => typeFilter === 'all' || tx.type === typeFilter)
      .filter((tx) => categoryFilter === 'all' || tx.categoryId === categoryFilter)
      .filter((tx) => {
        if (term === '') return true;
        const categoryName = categoriesById.get(tx.categoryId)?.name.toLowerCase() ?? '';
        return tx.note.toLowerCase().includes(term) || categoryName.includes(term);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactions, typeFilter, categoryFilter, query, categoriesById]);

  const netTotal = visible.reduce(
    (total, tx) => total + (tx.type === 'income' ? tx.amount : -tx.amount),
    0,
  );

  const hasFilters = typeFilter !== 'all' || categoryFilter !== 'all' || query.trim() !== '';

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Movimientos</h2>
          <p className="panel-subtitle">
            {visible.length} movimiento{visible.length === 1 ? '' : 's'} ·{' '}
            {formatCurrency(netTotal, currency)} neto
          </p>
        </div>
      </div>

      <div className="list-filters">
        <select
          className="input"
          value={typeFilter}
          onChange={(event) => {
            setTypeFilter(event.target.value as TypeFilter);
            setCategoryFilter('all');
          }}
          aria-label="Filtrar por tipo"
        >
          <option value="all">Todos</option>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </select>

        <select
          className="input"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="all">Todas las categorías</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.emoji} {category.name}
            </option>
          ))}
        </select>

        <div className="search-field">
          <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Buscar…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar movimientos"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            className="link-btn list-filters__clear"
            onClick={() => {
              setTypeFilter('all');
              setCategoryFilter('all');
              setQuery('');
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">
            <FontAwesomeIcon icon={hasFilters ? faMagnifyingGlassMinus : faReceipt} />
          </span>
          <p className="empty__title">
            {hasFilters ? 'No hay movimientos con esos filtros' : 'Todavía no hay movimientos este mes'}
          </p>
          <p className="empty__text">
            {hasFilters
              ? 'Probá limpiando la búsqueda o cambiando los filtros.'
              : 'Usá el formulario de la izquierda para registrar tu primer ingreso o gasto.'}
          </p>
        </div>
      ) : (
        <ul className="tx-list">
          {visible.map((tx) => {
            const category = categoriesById.get(tx.categoryId) ?? UNKNOWN_CATEGORY;
            return (
              <li className="tx-row" key={tx.id}>
                <span
                  className="tx-icon"
                  style={{ '--cat-color': category.color } as CSSProperties}
                  aria-hidden="true"
                >
                  {category.emoji}
                </span>

                <div className="tx-main">
                  <span className="tx-title">{tx.note || category.name}</span>
                  <span className="tx-meta">
                    {formatDayLabel(tx.date)} · {category.name}
                  </span>
                </div>

                <span className={`tx-amount tx-amount--${tx.type}`}>
                  {tx.type === 'expense' ? '−' : '+'}
                  {formatCurrency(tx.amount, currency)}
                </span>

                <div className="tx-actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    title="Editar movimiento"
                    aria-label={`Editar ${tx.note || category.name}`}
                    onClick={() => onEdit(tx)}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    title="Eliminar movimiento"
                    aria-label={`Eliminar ${tx.note || category.name}`}
                    onClick={() => onDelete(tx.id)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
