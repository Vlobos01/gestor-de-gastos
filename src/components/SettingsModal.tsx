import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins,
  faDatabase,
  faDownload,
  faFileCsv,
  faTrashCan,
  faTriangleExclamation,
  faUpload,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { useState, type ChangeEvent } from 'react';
import type { CurrencyCode } from '../types';
import { CURRENCIES } from '../lib/format';
import { Modal } from './Modal';

interface SettingsModalProps {
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onExport: () => void;
  onExportCsv: () => void;
  onImport: (file: File) => Promise<string | null>;
  onLoadDemo: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsModal({
  currency,
  onCurrencyChange,
  onExport,
  onExportCsv,
  onImport,
  onLoadDemo,
  onReset,
  onClose,
}: SettingsModalProps) {
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    const message = await onImport(file);
    setImporting(false);
    setError(message ?? '');
  }

  return (
    <Modal
      title="Ajustes y datos"
      subtitle="Todo se guarda en este navegador. Descargá un respaldo cuando quieras."
      onClose={onClose}
    >
      <section className="settings-group">
        <h3>
          <span className="settings-group__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCoins} />
          </span>
          Moneda
        </h3>
        <select
          className="input"
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
          aria-label="Moneda"
        >
          {CURRENCIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="settings-note">Cambia solo el formato de los montos, no los convierte.</p>
      </section>

      <section className="settings-group">
        <h3>
          <span className="settings-group__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faDatabase} />
          </span>
          Respaldo
        </h3>
        <div className="settings-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onExport}>
            <FontAwesomeIcon icon={faDownload} />
            Exportar JSON
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onExportCsv}>
            <FontAwesomeIcon icon={faFileCsv} />
            Exportar CSV
          </button>
          <label className="btn btn--ghost btn--sm file-btn">
            <FontAwesomeIcon icon={faUpload} />
            {importing ? 'Importando…' : 'Importar JSON'}
            <input type="file" accept="application/json,.json" onChange={handleFile} disabled={importing} />
          </label>
        </div>
        <p className="settings-note">
          El archivo incluye categorías, movimientos y presupuestos. Importar reemplaza los datos
          actuales.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="settings-group">
        <h3>
          <span className="settings-group__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </span>
          Datos de ejemplo
        </h3>
        <p className="settings-note">
          Carga cuatro meses de movimientos y presupuestos para probar la app. Reemplaza lo que
          tengas cargado.
        </p>
        <div className="settings-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLoadDemo}>
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            Cargar datos de ejemplo
          </button>
        </div>
      </section>

      <section className="settings-group">
        <h3>
          <span className="settings-group__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </span>
          Zona de riesgo
        </h3>
        <p className="settings-note">
          Borra todos los movimientos, presupuestos y categorías personalizadas.
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn--danger-ghost btn--sm"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              onReset();
              onClose();
            }}
          >
            <FontAwesomeIcon icon={faTrashCan} />
            {confirmReset ? 'Confirmar borrado' : 'Borrar todos los datos'}
          </button>
        </div>
      </section>
    </Modal>
  );
}
