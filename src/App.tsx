import { Suspense, lazy, useMemo, useState } from 'react';
import { BudgetPanel } from './components/BudgetPanel';
import { CategoryManager } from './components/CategoryManager';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { useFinanceStore } from './hooks/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { summarize, transactionsInMonth } from './lib/calculations';
import { currentMonth, firstDayOfMonth, monthOf, shiftMonth, todayISO } from './lib/date';
import { transactionsToCSV } from './lib/csv';
import { parseImportedState } from './lib/storage';
import type { Transaction } from './types';

// Los gráficos (Recharts) se cargan aparte para no bloquear la primera pintura.
const Charts = lazy(() => import('./components/Charts').then((module) => ({ default: module.Charts })));

export default function App() {
  const { state, dispatch } = useFinanceStore();
  const { theme, toggleTheme } = useTheme();

  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const monthTransactions = useMemo(
    () => transactionsInMonth(state.transactions, month),
    [state.transactions, month],
  );
  const summary = useMemo(() => summarize(monthTransactions), [monthTransactions]);
  const previousSummary = useMemo(
    () => summarize(transactionsInMonth(state.transactions, shiftMonth(month, -1))),
    [state.transactions, month],
  );

  const monthBudgets = state.budgets[month] ?? {};
  const canCopyPrevious = Object.keys(state.budgets[shiftMonth(month, -1)] ?? {}).length > 0;
  const defaultDate = month === currentMonth() ? todayISO() : firstDayOfMonth(month);

  function handleSaveTransaction(data: Omit<Transaction, 'id'>) {
    if (editing) {
      dispatch({ type: 'update-transaction', payload: { ...data, id: editing.id } });
      setEditing(null);
    } else {
      dispatch({ type: 'add-transaction', payload: data });
    }

    const savedMonth = monthOf(data.date);
    if (savedMonth !== month) setMonth(savedMonth);
  }

  function handleDeleteTransaction(id: string) {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    if (editing?.id === id) setEditing(null);
    dispatch({ type: 'delete-transaction', payload: { id } });
  }

  function handleDeleteCategory(id: string) {
    if (editing?.categoryId === id) setEditing(null);
    dispatch({ type: 'delete-category', payload: { id } });
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gestor-gastos-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCsv() {
    const blob = new Blob([transactionsToCSV(state)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gestor-gastos-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File): Promise<string | null> {
    try {
      const text = await file.text();
      dispatch({ type: 'replace-state', payload: parseImportedState(text) });
      setEditing(null);
      setMonth(currentMonth());
      setShowSettings(false);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No pudimos leer el archivo.';
    }
  }

  function handleLoadDemo() {
    if (
      state.transactions.length > 0 &&
      !window.confirm(
        'Ya tenés movimientos cargados. ¿Querés reemplazarlos por los datos de ejemplo?',
      )
    ) {
      return;
    }

    dispatch({ type: 'load-demo' });
    setEditing(null);
    setMonth(currentMonth());
    setShowSettings(false);
  }

  function handleReset() {
    dispatch({ type: 'reset' });
    setEditing(null);
    setMonth(currentMonth());
    setShowSettings(false);
  }

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <Header
        month={month}
        currency={state.currency}
        theme={theme}
        onMonthChange={(nextMonth) => {
          setMonth(nextMonth);
          setEditing(null);
        }}
        onToggleTheme={toggleTheme}
        onOpenCategories={() => setShowCategories(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="layout" id="contenido">
        <SummaryCards summary={summary} previous={previousSummary} currency={state.currency} />

        <div className="grid grid--split">
          <TransactionForm
            categories={state.categories}
            editing={editing}
            defaultDate={defaultDate}
            onSave={handleSaveTransaction}
            onCancelEdit={() => setEditing(null)}
            onManageCategories={() => setShowCategories(true)}
          />
          <TransactionList
            transactions={monthTransactions}
            categories={state.categories}
            currency={state.currency}
            onEdit={setEditing}
            onDelete={handleDeleteTransaction}
          />
        </div>

        <div className="grid grid--split">
          <BudgetPanel
            categories={state.categories}
            transactions={monthTransactions}
            month={month}
            budgets={monthBudgets}
            currency={state.currency}
            canCopyPrevious={canCopyPrevious}
            onSetBudget={(categoryId, amount) =>
              dispatch({ type: 'set-budget', payload: { month, categoryId, amount } })
            }
            onCopyPrevious={() =>
              dispatch({ type: 'copy-budgets', payload: { from: shiftMonth(month, -1), to: month } })
            }
          />
          <Suspense
            fallback={
              <div className="charts-stack">
                <section className="panel">
                  <p className="empty-chart">Cargando gráficos…</p>
                </section>
              </div>
            }
          >
            <Charts
              transactions={state.transactions}
              categories={state.categories}
              month={month}
              currency={state.currency}
            />
          </Suspense>
        </div>

        <footer className="footer">
          <p>Tus datos se guardan solo en este navegador. Exportá un respaldo desde Ajustes.</p>
          <p>Hecho con React + TypeScript</p>
        </footer>
      </main>

      {showCategories && (
        <CategoryManager
          categories={state.categories}
          transactions={state.transactions}
          onAdd={(category) => dispatch({ type: 'add-category', payload: category })}
          onUpdate={(category) => dispatch({ type: 'update-category', payload: category })}
          onDelete={handleDeleteCategory}
          onClose={() => setShowCategories(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          currency={state.currency}
          onCurrencyChange={(currency) => dispatch({ type: 'set-currency', payload: currency })}
          onExport={handleExport}
          onExportCsv={handleExportCsv}
          onImport={handleImport}
          onLoadDemo={handleLoadDemo}
          onReset={handleReset}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
