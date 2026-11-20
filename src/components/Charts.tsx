import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faChartPie } from '@fortawesome/free-solid-svg-icons';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Category, CurrencyCode, Transaction } from '../types';
import { expensesByCategory, recentMonthSeries, transactionsInMonth } from '../lib/calculations';
import { compactNumber, formatCurrency, formatPercent } from '../lib/format';
import { formatMonthLabel } from '../lib/date';

interface ChartsProps {
  transactions: Transaction[];
  categories: Category[];
  month: string;
  currency: CurrencyCode;
}

interface DonutSlice {
  id: string;
  name: string;
  color: string;
  amount: number;
  share: number;
}

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 13,
  boxShadow: 'var(--shadow)',
};

const labelStyle = { color: 'var(--text-muted)' };
const itemStyle = { color: 'var(--text)' };

export function Charts({ transactions, categories, month, currency }: ChartsProps) {
  const totals = useMemo(
    () => expensesByCategory(transactionsInMonth(transactions, month), categories),
    [transactions, categories, month],
  );
  const series = useMemo(() => recentMonthSeries(transactions, month, 6), [transactions, month]);

  const slices = useMemo<DonutSlice[]>(() => {
    const top = totals.slice(0, 6).map((item) => ({
      id: item.category.id,
      name: item.category.name,
      color: item.category.color,
      amount: item.amount,
      share: item.share,
    }));

    const rest = totals.slice(6);
    if (rest.length > 0) {
      const restAmount = rest.reduce((sum, item) => sum + item.amount, 0);
      const total = totals.reduce((sum, item) => sum + item.amount, 0);
      top.push({
        id: 'group-other',
        name: 'Otras categorías',
        color: '#94a3b8',
        amount: restAmount,
        share: total > 0 ? restAmount / total : 0,
      });
    }

    return top;
  }, [totals]);

  const totalExpenses = totals.reduce((sum, item) => sum + item.amount, 0);
  const hasHistory = series.some((point) => point.income > 0 || point.expense > 0);

  return (
    <div className="charts-stack">
      <section className="panel">
        <div className="panel-header">
          <div className="panel-heading">
            <span className="panel-heading__icon" aria-hidden="true">
              <FontAwesomeIcon icon={faChartPie} />
            </span>
            <div>
              <h2 className="panel-title">Gastos por categoría</h2>
              <p className="panel-subtitle">{formatMonthLabel(month)}</p>
            </div>
          </div>
        </div>

        {slices.length === 0 ? (
          <p className="empty-chart">
            Todavía no hay gastos este mes. Agregá uno para ver el desglose por categoría.
          </p>
        ) : (
          <>
            <div className="chart-wrap">
              <div className="chart-box chart-box--donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slices}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {slices.map((slice) => (
                        <Cell key={slice.id} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), currency)}
                      contentStyle={tooltipStyle}
                      labelStyle={labelStyle}
                      itemStyle={itemStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-center">
                <span className="donut-center__label">Total gastado</span>
                <span className="donut-center__value">{formatCurrency(totalExpenses, currency)}</span>
              </div>
            </div>

            <ul className="legend">
              {slices.map((slice) => (
                <li className="legend__item" key={slice.id}>
                  <span className="legend__dot" style={{ backgroundColor: slice.color }} />
                  <span className="legend__name">{slice.name}</span>
                  <span className="legend__share">{formatPercent(slice.share)}</span>
                  <span className="legend__amount">{formatCurrency(slice.amount, currency)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-heading">
            <span className="panel-heading__icon panel-heading__icon--positive" aria-hidden="true">
              <FontAwesomeIcon icon={faChartColumn} />
            </span>
            <div>
              <h2 className="panel-title">Ingresos vs. gastos</h2>
              <p className="panel-subtitle">Últimos 6 meses</p>
            </div>
          </div>
        </div>

        {hasHistory ? (
          <div className="chart-box chart-box--bars">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => compactNumber(Number(value))}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), currency)}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={itemStyle}
                  cursor={{ fill: 'var(--surface-2)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => (value === 'income' ? 'Ingresos' : 'Gastos')}
                />
                <Bar dataKey="income" name="income" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="empty-chart">Cargá movimientos para ver la evolución mensual.</p>
        )}
      </section>
    </div>
  );
}
