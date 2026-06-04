import type {
  DashboardHolding,
  DashboardQuote,
  DashboardSnapshot,
  DashboardSummary,
} from './types';

const cryptoTickers = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT']);

export function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';

  return `${sign}${value.toFixed(2)}%`;
}

export function getMarketValue(
  holdings: DashboardHolding[],
  quotes: Record<string, DashboardQuote>
) {
  return holdings.reduce((total, holding) => {
    const quote = quotes[holding.ticker.toUpperCase()];

    return total + (quote ? holding.quantity * quote.price : holding.cost);
  }, 0);
}

export function getUnrealizedPnl(
  holdings: DashboardHolding[],
  quotes: Record<string, DashboardQuote>
) {
  return holdings.reduce((total, holding) => {
    const quote = quotes[holding.ticker.toUpperCase()];

    return total + (quote ? holding.quantity * quote.price - holding.cost : 0);
  }, 0);
}

export function getTaxReserve(ytdProfit: number) {
  return Math.max(ytdProfit * 0.195, 0);
}

export function hasUsefulHistory(snapshots: DashboardSnapshot[]) {
  if (snapshots.length < 6) {
    return false;
  }

  const values = snapshots.map(snapshot => snapshot.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const movement = max - min;

  return movement > Math.max(max * 0.015, 1);
}

function getPeriodMonths(period: string) {
  if (period.includes('10')) {
    return 120;
  }

  if (period.includes('5')) {
    return 60;
  }

  if (period.includes('1 рік')) {
    return 12;
  }

  if (period.includes('6')) {
    return 6;
  }

  return 1;
}

function getPeriodDate(index: number, length: number, period: string) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  const progress = length <= 1 ? 1 : index / (length - 1);

  startDate.setMonth(startDate.getMonth() - getPeriodMonths(period));

  return new Date(
    startDate.getTime() + (endDate.getTime() - startDate.getTime()) * progress
  ).toISOString();
}

export function buildStarterCurve(
  totalCapital: number,
  invested: number,
  period: string
) {
  const finish = totalCapital > 0 ? totalCapital : invested || 100;
  const start = invested > 0 ? invested : finish * 0.82;
  const middle = (start + finish) / 2;
  const lift = Math.max(Math.abs(finish - start), finish * 0.06, 8);
  const values = [
    start,
    start + lift * 0.12,
    middle - lift * 0.18,
    middle + lift * 0.08,
    middle + lift * 0.22,
    finish - lift * 0.2,
    finish,
  ];

  return values.map((value, index) => ({
    id: `fallback-${index}`,
    value: Math.max(value, 0),
    createdAt: getPeriodDate(index, values.length, period),
  }));
}

export function buildAllocation(
  holdings: DashboardHolding[],
  quotes: Record<string, DashboardQuote>,
  summary: DashboardSummary
) {
  const buckets = { stocks: 0, crypto: 0, cash: Math.max(summary.cash, 0) };

  holdings.forEach(holding => {
    const quote = quotes[holding.ticker.toUpperCase()];
    const value = quote ? holding.quantity * quote.price : holding.cost;

    if (cryptoTickers.has(holding.ticker.toUpperCase())) {
      buckets.crypto += value;
      return;
    }

    buckets.stocks += value;
  });

  return [
    { id: 'stocks', label: 'Акції та ETF', value: buckets.stocks, color: '#6466f1' },
    { id: 'crypto', label: 'Криптовалюта', value: buckets.crypto, color: '#14b981' },
    { id: 'cash', label: 'Готівка / Депозити', value: buckets.cash, color: '#f59e0b' },
  ].filter(item => item.value > 0);
}
