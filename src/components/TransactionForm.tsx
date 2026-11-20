import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Category, Transaction, TxType } from '../types';
import { isISODate } from '../lib/date';

interface TransactionFormProps {
  categories: Category[];
  editing: Transaction | null;
  defaultDate: string;
  onSave: (data: Omit<Transaction, 'id'>) => void;
  onCancelEdit: () => void;
  onManageCategories: () => void;
}

export function TransactionForm({
  categories,
  editing,
  defaultDate,
  onSave,
  onCancelEdit,
  onManageCategories,
}: TransactionFormProps) {
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  useEffect(() => {
    if (!editing) return;
    setType(editing.type);
    setAmount(String(editing.amount));
    setCategoryId(editing.categoryId);
    setDate(editing.date);
    setNote(editing.note);
    setError('');
  }, [editing]);

  useEffect(() => {
    if (!editing) setDate(defaultDate);
  }, [defaultDate, editing]);

  function changeType(nextType: TxType) {
    setType(nextType);
    setError('');
    const current = categories.find((category) => category.id === categoryId);
    if (current && current.type !== nextType) setCategoryId('');
  }

  function resetFields() {
    setAmount('');
    setNote('');
    setCategoryId('');
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError('Ingresá un monto mayor a cero.');
      return;
    }
    if (!categories.some((category) => category.id === categoryId && category.type === type)) {
      setError('Elegí una categoría.');
      return;
    }
    if (!isISODate(date)) {
      setError('Elegí una fecha válida.');
      return;
    }

    onSave({
      type,
      amount: Math.round(value * 100) / 100,
      categoryId,
      date,
      note: note.trim(),
    });
    resetFields();
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
          <p className="panel-subtitle">
            {editing ? 'Actualizá los datos y guardá los cambios.' : 'Registrá un ingreso o un gasto del mes.'}
          </p>
        </div>
      </div>

      <div className="segmented" role="group" aria-label="Tipo de movimiento">
        <button
          type="button"
          className={`segmented__btn segmented__btn--expense ${type === 'expense' ? 'is-active' : ''}`}
          onClick={() => changeType('expense')}
          aria-pressed={type === 'expense'}
        >
          <span className="segmented__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faArrowUp} />
          </span>
          Gasto
        </button>
        <button
          type="button"
          className={`segmented__btn segmented__btn--income ${type === 'income' ? 'is-active' : ''}`}
          onClick={() => changeType('income')}
          aria-pressed={type === 'income'}
        >
          <span className="segmented__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faArrowDown} />
          </span>
          Ingreso
        </button>
      </div>

      <label className="field">
        <span className="field__label">Monto</span>
        <input
          className="input input--amount"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          autoComplete="off"
        />
      </label>

      <label className="field">
        <span className="field__label">Categoría</span>
        <select
          className="input"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Seleccionar…</option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.emoji} {category.name}
            </option>
          ))}
        </select>
      </label>

      {availableCategories.length === 0 && (
        <p className="hint">
          No hay categorías de {type === 'expense' ? 'gasto' : 'ingreso'}.{' '}
          <button type="button" className="link-btn" onClick={onManageCategories}>
            Crear una
          </button>
        </p>
      )}

      <div className="field-row">
        <label className="field">
          <span className="field__label">Fecha</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Nota (opcional)</span>
          <input
            className="input"
            type="text"
            placeholder="Ej: Supermercado"
            maxLength={80}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          <FontAwesomeIcon icon={editing ? faCheck : faPlus} />
          {editing ? 'Guardar cambios' : 'Agregar movimiento'}
        </button>
        {editing && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              onCancelEdit();
              resetFields();
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
