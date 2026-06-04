'use client';

import { useMemo, useState } from 'react';
import { AllocationDonut } from './AllocationDonut';
import { CapitalChart } from './CapitalChart';
import {
  buildAllocation,
  buildStarterCurve,
  formatMoney,
  formatPercent,
  getMarketValue,
  getTaxReserve,
  getUnrealizedPnl,
  hasUsefulHistory,
} from './dashboardMath';
import { MetricCard } from './MetricCard';
import type {
  DashboardAccountOption,
  DashboardHolding,
  DashboardQuote,
  DashboardSnapshot,
  DashboardSummary,
  DashboardTransaction,
  QuoteStatus,
} from './types';
import styles from './PortfolioDashboard.module.css';

type PortfolioDashboardProps = {
  accountOptions: readonly DashboardAccountOption[];
  activeAccountId: string;
  holdings: DashboardHolding[];
  marketQuotes: Record<string, DashboardQuote>;
  onAccountChange: (id: string) => void;
  onRefreshQuotes: () => void;
  priceSnapshots: DashboardSnapshot[];
  quoteStatus: QuoteStatus;
  summary: DashboardSummary;
  transactions: DashboardTransaction[];
};

export function PortfolioDashboard({
  accountOptions,
  activeAccountId,
  holdings,
  marketQuotes,
  onAccountChange,
  onRefreshQuotes,
  priceSnapshots,
  quoteStatus,
  summary,
  transactions,
}: PortfolioDashboardProps) {
  const [activePeriod, setActivePeriod] = useState('1 рік');
  const marketValue = getMarketValue(holdings, marketQuotes);
  const unrealizedPnl = getUnrealizedPnl(holdings, marketQuotes);
  const totalCapital = marketValue + Math.max(summary.cash, 0);
  const ytdProfit = unrealizedPnl + summary.income;
  const taxReserve = getTaxReserve(ytdProfit);
  const growthPercent = summary.invested > 0 ? (unrealizedPnl / summary.invested) * 100 : 0;
  const chartSnapshots = useMemo(
    () =>
      hasUsefulHistory(priceSnapshots)
        ? priceSnapshots
        : buildStarterCurve(totalCapital, summary.invested, activePeriod),
    [activePeriod, priceSnapshots, summary.invested, totalCapital]
  );
  const allocation = buildAllocation(holdings, marketQuotes, summary);
  const isSynced = quoteStatus === 'ready';

  return (
    <div className={styles.surface}>
      <header className={styles.header}>
        <div>
          <h1>Головний Дашборд портфеля</h1>
          <p>Загальний огляд ваших інвестицій та фінансових результатів</p>
        </div>

        <div className={styles.headerTools}>
          <button className={styles.syncPill} type="button" onClick={onRefreshQuotes}>
            {quoteStatus === 'loading'
              ? 'Оновлюється'
              : isSynced
                ? 'Синхронізовано'
                : 'Оновити ринок'}
          </button>
          <span className={styles.currencyPill}>Базова валюта: USD</span>
        </div>
      </header>

      <div className={styles.accountTabs}>
        {accountOptions.map(account => (
          <button
            className={account.id === activeAccountId ? styles.active : ''}
            key={account.id}
            type="button"
            onClick={() => onAccountChange(account.id)}
          >
            {account.label}
          </button>
        ))}
      </div>

      <section className={styles.metricsGrid}>
        <MetricCard
          label="Загальний баланс портфеля"
          value={formatMoney(totalCapital)}
          hint={`${formatPercent(growthPercent)} з початку обліку`}
        />
        <MetricCard
          label="Очікуваний річний прибуток (YTD)"
          value={formatMoney(ytdProfit)}
          hint="Розраховано з ринкових цін"
        />
        <MetricCard
          label="Резерв на податки (орієнтовно)"
          value={formatMoney(taxReserve)}
          tone="orange"
          hint={transactions.length > 0 ? 'Чернетка для майбутнього FIFO' : 'Дані ще порожні'}
        />
      </section>

      <section className={styles.visualGrid}>
        <CapitalChart
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          snapshots={chartSnapshots}
        />
        <AllocationDonut items={allocation} />
      </section>
    </div>
  );
}
