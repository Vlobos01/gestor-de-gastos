import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import type { Category, TxType } from '../types';
import type { Transaction } from '../types';
import { CATEGORY_COLORS } from '../lib/format';
import { Modal } from './Modal';

interface CategoryManagerProps {
  categories: Category[];
  transactions: Transaction[];
  onAdd: (data: Omit<Category, 'id'>) => void;
  onUpdate: (category: Category) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

interface Draft {
  name: string;
  emoji: string;
  color: string;
  type: TxType;
}

const EMPTY_DRAFT: Draft = { name: '', emoji: '🛒', color: CATEGORY_COLORS[0], type: 'expense' };

const EMOJI_SUGGESTIONS = [
  '🛒', '🍔', '🚌', '🏠', '💡', '💊', '📚', '🎬',
  '✈️', '🐶', '👕', '🎁', '💼', '💻', '📈', '💰',
];

export function CategoryManager({
  categories,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: CategoryManagerProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + 1);
    }
    return map;
  }, [transactions]);

  const expenseCategories = categories.filter((category) => category.type === 'expense');
  const incomeCategories = categories.filter((category) => category.type === 'income');

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError('');
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      emoji: category.emoji,
      color: category.color,
      type: category.type,
    });
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = draft.name.trim();
    if (name.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const duplicated = categories.some(
      (category) =>
        category.id !== editingId &&
        category.type === draft.type &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicated) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }

    const payload = {
      name,
      emoji: draft.emoji.trim() || '🏷️',
      color: draft.color,
      type: draft.type,
    };

    if (editingId) onUpdate({ ...payload, id: editingId });
    else onAdd(payload);

    resetForm();
  }

  function handleDelete(category: Category) {
    const count = usage.get(category.id) ?? 0;
    const detail = count > 0 ? ` Se eliminarán también ${count} movimiento${count === 1 ? '' : 's'}.` : '';
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?${detail}`)) return;
    if (editingId === category.id) resetForm();
    onDelete(category.id);
  }

  function renderList(list: Category[], title: string) {
    return (
      <section>
        <h3 className="cat-title">{title}</h3>
        <ul className="category-list">
          {list.map((category) => (
            <li className={`category-item ${editingId === category.id ? 'is-editing' : ''}`} key={category.id}>
              <span
                className="cat-emoji"
                style={{ '--cat-color': category.color } as CSSProperties}
                aria-hidden="true"
              >
                {category.emoji}
              </span>
              <span className="cat-name">{category.name}</span>
              <span className="cat-usage">{usage.get(category.id) ?? 0} mov.</span>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                onClick={() => startEdit(category)}
                title="Editar categoría"
                aria-label={`Editar ${category.name}`}
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                onClick={() => handleDelete(category)}
                title="Eliminar categoría"
                aria-label={`Eliminar ${category.name}`}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <Modal
      title="Categorías"
      subtitle="Organizá tus ingresos y gastos con categorías propias."
      onClose={onClose}
    >
      <form className="category-form" onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Tipo de categoría">
          <button
            type="button"
            className={`segmented__btn ${draft.type === 'expense' ? 'is-active' : ''}`}
            onClick={() => setDraft((current) => ({ ...current, type: 'expense' }))}
            aria-pressed={draft.type === 'expense'}
          >
            Gasto
          </button>
          <button
            type="button"
            className={`segmented__btn ${draft.type === 'income' ? 'is-active' : ''}`}
            onClick={() => setDraft((current) => ({ ...current, type: 'income' }))}
            aria-pressed={draft.type === 'income'}
          >
            Ingreso
          </button>
        </div>

        <div className="category-form__row">
          <label className="field">
            <span className="field__label">Nombre</span>
            <input
              className="input"
              type="text"
              placeholder="Ej: Mascotas"
              maxLength={32}
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">Ícono</span>
            <input
              className="input emoji-input"
              type="text"
              maxLength={2}
              value={draft.emoji}
              onChange={(event) => setDraft((current) => ({ ...current, emoji: event.target.value }))}
            />
          </label>
        </div>

        <div className="field">
          <span className="field__label">Íconos rápidos</span>
          <div className="emoji-picker" role="group" aria-label="Íconos rápidos para la categoría">
            {EMOJI_SUGGESTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-picker__btn ${draft.emoji === emoji ? 'is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, emoji }))}
                aria-label={`Elegir ícono ${emoji}`}
                aria-pressed={draft.emoji === emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Color</span>
          <div className="swatches">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${draft.color === color ? 'is-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setDraft((current) => ({ ...current, color }))}
                aria-label={`Elegir color ${color}`}
                aria-pressed={draft.color === color}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--sm">
            {editingId ? 'Guardar cambios' : 'Agregar categoría'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="category-columns">
        {renderList(expenseCategories, 'Gastos')}
        {renderList(incomeCategories, 'Ingresos')}
      </div>
    </Modal>
  );
}
