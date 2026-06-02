'use client';

import type { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type RoomWorkspaceProps = {
  user: Session['user'];
};

const STORAGE_KEY = 'aqua-room-ledger-v1';
const AUTO_QUOTE_REFRESH_MS = 60_000;
const MAX_PRICE_SNAPSHOTS = 32;

const accountFilters = [
  { id: 'all', label: 'Усі акаунти', detail: 'Разом' },
  { id: 'ibkr', label: 'IBKR', detail: 'Брокер' },
  { id: 'xtb', label: 'XTB', detail: 'Брокер' },
] as const;

const brokerAccounts = [
  { id: 'ibkr', label: 'IBKR' },
  { id: 'xtb', label: 'XTB' },
] as const;

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Дашборд',
    marker: 'DB',
    title: 'Головний дашборд',
    subtitle: 'Зведення по вартості, результату, акаунтах і важливих діях.',
  },
  {
    id: 'holdings',
    label: 'Активи',
    marker: 'AC',
    title: 'Поточні активи',
    subtitle: 'Позиції, частки, середня ціна та ризики концентрації.',
  },
  {
    id: 'ledger',
    label: 'Журнал',
    marker: 'LG',
    title: 'Журнал операцій',
    subtitle: 'Єдине місце для купівель, продажів, доходів, комісій і переказів.',
  },
  {
    id: 'taxes',
    label: 'FIFO податки',
    marker: 'TX',
    title: 'FIFO та податки',
    subtitle: 'Розрахунок прибутку, збитків, валют і підготовка до декларації.',
  },
  {
    id: 'calendar',
    label: 'Календар',
    marker: 'CL',
    title: 'Календар подій',
    subtitle: 'Дивіденди, податкові дати, ребалансування та нагадування.',
  },
  {
    id: 'diary',
    label: 'Щоденник',
    marker: 'NT',
    title: 'Нотатки інвестора',
    subtitle: 'Причини купівлі, продажу і власні висновки після рішень.',
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    marker: 'WL',
    title: 'Список спостереження',
    subtitle: 'Ідеї, цільові ціни й активи, які ще не куплені.',
  },
  {
    id: 'settings',
    label: 'Налаштування',
    marker: 'ST',
    title: 'Налаштування кабінету',
    subtitle: 'Валюта, джерела цін, брокери, імпорт і приватність.',
  },
] as const;

const transactionTypeOptions = [
  { id: 'buy', label: 'Купівля' },
  { id: 'sell', label: 'Продаж' },
  { id: 'dividend', label: 'Дивіденд' },
  { id: 'deposit', label: 'Поповнення' },
  { id: 'withdrawal', label: 'Виведення' },
  { id: 'fee', label: 'Комісія' },
] as const;

const currencyOptions = ['USD', 'EUR', 'PLN', 'UAH'] as const;

type AccountFilterId = (typeof accountFilters)[number]['id'];
type BrokerAccountId = (typeof brokerAccounts)[number]['id'];
type CurrencyCode = (typeof currencyOptions)[number];
type NavigationId = (typeof navigationItems)[number]['id'];
type TransactionType = (typeof transactionTypeOptions)[number]['id'];

type LedgerTransaction = {
  id: string;
  account: BrokerAccountId;
  type: TransactionType;
  date: string;
  ticker: string;
  assetName: string;
  quantity: number;
  price: number;
  amount: number;
  currency: CurrencyCode;
  fee: number;
  note: string;
};

type TransactionFormState = {
  account: BrokerAccountId;
  type: TransactionType;
  date: string;
  ticker: string;
  assetName: string;
  quantity: string;
  price: string;
  amount: string;
  currency: CurrencyCode;
  fee: string;
  note: string;
};

type HoldingRow = {
  key: string;
  ticker: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  cost: number;
  currency: CurrencyCode;
};

type LedgerSummary = {
  cash: number;
  income: number;
  invested: number;
  holdingsCost: number;
  operationCount: number;
  hasMixedCurrencies: boolean;
};

type MarketSearchResult = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  region: string;
  type: string;
  provider: string;
};

type MarketQuote = {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  updatedAt: string;
};

type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error';

type PriceSnapshot = {
  id: string;
  value: number;
  createdAt: string;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm(): TransactionFormState {
  return {
    account: 'ibkr',
    type: 'buy',
    date: todayString(),
    ticker: '',
    assetName: '',
    quantity: '',
    price: '',
    amount: '',
    currency: 'USD',
    fee: '',
    note: '',
  };
}

function getInitials(name?: string | null, email?: string | null) {
  const fallback = email?.slice(0, 2) ?? 'AR';

  if (!name) {
    return fallback.toUpperCase();
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function isTradeType(type: TransactionType) {
  return type === 'buy' || type === 'sell';
}

function parseNumber(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits,
  }).format(value);
}

function toPriceInputValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(4);
}

function getTypeLabel(type: TransactionType) {
  return transactionTypeOptions.find(option => option.id === type)?.label ?? type;
}

function getAccountLabel(account: BrokerAccountId) {
  return brokerAccounts.find(option => option.id === account)?.label ?? account;
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeCurrency(value: string): CurrencyCode {
  const upperValue = value.toUpperCase();

  return currencyOptions.includes(upperValue as CurrencyCode)
    ? (upperValue as CurrencyCode)
    : 'USD';
}

function sanitizeSearchResults(value: unknown): MarketSearchResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(item => {
    if (!isRecord(item)) {
      return [];
    }

    const symbol = readString(item.symbol);

    if (!symbol) {
      return [];
    }

    return [
      {
        symbol,
        name: readString(item.name) || symbol,
        currency: readString(item.currency) || 'USD',
        exchange: readString(item.exchange),
        region: readString(item.region),
        type: readString(item.type),
        provider: readString(item.provider),
      },
    ];
  });
}

function sanitizeQuotes(value: unknown): Record<string, MarketQuote> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (!isRecord(item)) {
        return [];
      }

      const price = readNumber(item.price);

      if (price === null) {
        return [];
      }

      return [
        [
          key.toUpperCase(),
          {
            symbol: readString(item.symbol) || key.toUpperCase(),
            price,
            currency: readString(item.currency) || 'USD',
            provider: readString(item.provider),
            updatedAt: readString(item.updatedAt),
          },
        ],
      ];
    })
  );
}

function sanitizeTransactions(value: unknown): LedgerTransaction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(item => {
    if (!isRecord(item)) {
      return [];
    }

    const currency = currencyOptions.includes(item.currency as CurrencyCode)
      ? (item.currency as CurrencyCode)
      : 'USD';
    const account = brokerAccounts.some(option => option.id === item.account)
      ? (item.account as BrokerAccountId)
      : 'ibkr';
    const type = transactionTypeOptions.some(option => option.id === item.type)
      ? (item.type as TransactionType)
      : 'buy';

    return [
      {
        id: typeof item.id === 'string' ? item.id : createId(),
        account,
        type,
        date: typeof item.date === 'string' ? item.date : todayString(),
        ticker: typeof item.ticker === 'string' ? item.ticker : '',
        assetName: typeof item.assetName === 'string' ? item.assetName : '',
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        price: typeof item.price === 'number' ? item.price : 0,
        amount: typeof item.amount === 'number' ? item.amount : 0,
        currency,
        fee: typeof item.fee === 'number' ? item.fee : 0,
        note: typeof item.note === 'string' ? item.note : '',
      },
    ];
  });
}

function getCashDelta(transaction: LedgerTransaction) {
  if (transaction.type === 'buy') {
    return -(transaction.amount + transaction.fee);
  }

  if (transaction.type === 'sell') {
    return transaction.amount - transaction.fee;
  }

  if (transaction.type === 'deposit' || transaction.type === 'dividend') {
    return transaction.amount;
  }

  return -transaction.amount;
}

function calculateHoldings(transactions: LedgerTransaction[]) {
  const holdings = new Map<string, HoldingRow>();

  transactions.forEach(transaction => {
    if (!isTradeType(transaction.type) || !transaction.ticker) {
      return;
    }

    const key = `${transaction.ticker}-${transaction.currency}`;
    const current = holdings.get(key) ?? {
      key,
      ticker: transaction.ticker,
      assetName: transaction.assetName,
      quantity: 0,
      averagePrice: 0,
      cost: 0,
      currency: transaction.currency,
    };

    if (transaction.type === 'buy') {
      const cost = transaction.amount + transaction.fee;
      const nextQuantity = current.quantity + transaction.quantity;
      const nextCost = current.cost + cost;

      holdings.set(key, {
        ...current,
        assetName: transaction.assetName || current.assetName,
        quantity: nextQuantity,
        averagePrice: nextQuantity > 0 ? nextCost / nextQuantity : 0,
        cost: nextCost,
      });
    }

    if (transaction.type === 'sell' && current.quantity > 0) {
      const quantityToSell = Math.min(transaction.quantity, current.quantity);
      const costReduction = quantityToSell * current.averagePrice;
      const nextQuantity = current.quantity - quantityToSell;
      const nextCost = Math.max(0, current.cost - costReduction);

      holdings.set(key, {
        ...current,
        quantity: nextQuantity,
        averagePrice: nextQuantity > 0 ? nextCost / nextQuantity : 0,
        cost: nextCost,
      });
    }
  });

  return Array.from(holdings.values()).filter(holding => holding.quantity > 0);
}

function calculateSummary(
  transactions: LedgerTransaction[],
  holdings: HoldingRow[]
): LedgerSummary {
  const currencies = new Set(transactions.map(transaction => transaction.currency));

  return {
    cash: transactions.reduce((total, transaction) => total + getCashDelta(transaction), 0),
    income: transactions
      .filter(transaction => transaction.type === 'dividend')
      .reduce((total, transaction) => total + transaction.amount, 0),
    invested: transactions
      .filter(transaction => transaction.type === 'buy')
      .reduce((total, transaction) => total + transaction.amount + transaction.fee, 0),
    holdingsCost: holdings.reduce((total, holding) => total + holding.cost, 0),
    operationCount: transactions.length,
    hasMixedCurrencies: currencies.size > 1,
  };
}

function filterByAccount(
  transactions: LedgerTransaction[],
  activeAccountId: AccountFilterId
) {
  if (activeAccountId === 'all') {
    return transactions;
  }

  return transactions.filter(transaction => transaction.account === activeAccountId);
}

function calculatePortfolioMarketValue(
  holdings: HoldingRow[],
  marketQuotes: Record<string, MarketQuote>
) {
  return holdings.reduce((total, holding) => {
    const quote = marketQuotes[holding.ticker.toUpperCase()];

    return total + (quote ? holding.quantity * quote.price : holding.cost);
  }, 0);
}

function createSnapshotChartPoints(priceSnapshots: PriceSnapshot[]) {
  if (priceSnapshots.length < 2) {
    return '';
  }

  const values = priceSnapshots.map(snapshot => snapshot.value);
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const padding = Math.max(Math.abs(max) * 0.01, 1);

    min -= padding;
    max += padding;
  }

  const left = 38;
  const right = 618;
  const top = 52;
  const bottom = 214;
  const range = max - min;

  return priceSnapshots
    .map((snapshot, index) => {
      const progress = index / (priceSnapshots.length - 1);
      const x = left + (right - left) * progress;
      const y = bottom - ((snapshot.value - min) / range) * (bottom - top);

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function DashboardOverview({
  holdings,
  marketQuotes,
  onOpenLedger,
  onRefreshQuotes,
  priceSnapshots,
  quoteStatus,
  quoteUpdatedAt,
  summary,
  transactions,
}: {
  holdings: HoldingRow[];
  marketQuotes: Record<string, MarketQuote>;
  onOpenLedger: () => void;
  onRefreshQuotes: () => void;
  priceSnapshots: PriceSnapshot[];
  quoteStatus: QuoteStatus;
  quoteUpdatedAt: string;
  summary: LedgerSummary;
  transactions: LedgerTransaction[];
}) {
  const holdingValues = holdings.map(holding => {
    const quote = marketQuotes[holding.ticker.toUpperCase()];
    const currentValue = quote ? holding.quantity * quote.price : holding.cost;
    const pnl = quote ? currentValue - holding.cost : 0;

    return {
      currentValue,
      hasQuote: Boolean(quote),
      pnl,
    };
  });
  const currentValue = holdingValues.reduce(
    (total, holding) => total + holding.currentValue,
    0
  );
  const unrealizedPnl = holdingValues.reduce((total, holding) => total + holding.pnl, 0);
  const quotedCount = holdingValues.filter(holding => holding.hasQuote).length;
  const chartPoints = createSnapshotChartPoints(priceSnapshots);
  const chartPointList = chartPoints ? chartPoints.split(' ') : [];
  const latestChartPoint =
    chartPointList.length > 0
      ? chartPointList[chartPointList.length - 1].split(',')
      : [];
  const latestSnapshot = priceSnapshots[priceSnapshots.length - 1];
  const previousSnapshot = priceSnapshots[priceSnapshots.length - 2];
  const snapshotDelta =
    latestSnapshot && previousSnapshot ? latestSnapshot.value - previousSnapshot.value : 0;
  const metricCards = [
    {
      label: 'Поточна вартість',
      value: formatMoney(currentValue),
      hint:
        quotedCount > 0
          ? `${quotedCount} позицій з ринковою ціною`
          : 'Поки за собівартістю',
    },
    {
      label: 'Вкладено',
      value: formatMoney(summary.invested),
      hint: summary.hasMixedCurrencies ? 'Є різні валюти' : 'З журналу купівель',
    },
    {
      label: 'Нереалізований PnL',
      value: formatMoney(unrealizedPnl),
      hint: quotedCount > 0 ? 'З ринкових цін' : 'Очікує оновлення цін',
    },
    {
      label: 'Операцій',
      value: String(summary.operationCount),
      hint: 'Локальний журнал',
    },
  ];

  return (
    <div className="dashboard-grid">
      <div className="metric-row">
        {metricCards.map(card => (
          <article className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </div>

      <section className="dashboard-card performance-card">
        <div className="card-heading">
          <div>
            <span>Динаміка</span>
            <h2>Графік вартості</h2>
          </div>
          <button
            className="text-action-button"
            type="button"
            onClick={onRefreshQuotes}
          >
            {quoteStatus === 'loading' ? 'Оновлюю...' : 'Оновити ціни'}
          </button>
        </div>

        <div className="chart-shell" aria-label="Графік вартості портфеля">
          <svg viewBox="0 0 640 260" role="img">
            <path
              d="M30 220H610M30 170H610M30 120H610M30 70H610"
              className="chart-grid-line"
            />
            {chartPoints ? (
              <>
                <polygon
                  className="chart-main-fill"
                  points={`${chartPoints} 618,240 38,240`}
                />
                <polyline className="chart-main-line" points={chartPoints} />
                <circle
                  className="chart-live-dot"
                  cx={latestChartPoint[0] ?? '618'}
                  cy={latestChartPoint[1] ?? '52'}
                  r="5"
                />
              </>
            ) : (
              <>
                <path
                  d="M38 214C96 198 120 177 174 184C234 192 248 132 304 146C366 162 380 78 430 94C486 112 502 62 562 72C584 76 600 64 618 52"
                  className="chart-main-line"
                />
                <path
                  d="M38 214C96 198 120 177 174 184C234 192 248 132 304 146C366 162 380 78 430 94C486 112 502 62 562 72C584 76 600 64 618 52V240H38Z"
                  className="chart-main-fill"
                />
              </>
            )}
          </svg>
          <div className="chart-empty-label">
            <strong>
              {latestSnapshot
                ? formatMoney(latestSnapshot.value)
                : quotedCount > 0
                  ? 'Ціни підтягнуті'
                  : 'Ринкові ціни ще не оновлені'}
            </strong>
            <span>
              {latestSnapshot
                ? `${
                    snapshotDelta >= 0 ? '+' : ''
                  }${formatMoney(snapshotDelta)} з останнього оновлення`
                : quoteUpdatedAt
                ? `Останнє оновлення: ${new Date(quoteUpdatedAt).toLocaleString('uk-UA')}`
                : 'Натисни “Оновити ціни”, щоб підтягнути ринок через API.'}
            </span>
          </div>
        </div>
      </section>

      <aside className="dashboard-side-stack">
        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span>Розподіл</span>
              <h2>Класи активів</h2>
            </div>
          </div>
          <div className="allocation-layout">
            <div className="allocation-donut" aria-hidden="true" />
            <div className="allocation-list">
              <div>
                <span>Позицій</span>
                <strong>{holdings.length}</strong>
              </div>
              <div>
                <span>Активів у журналі</span>
                <strong>{new Set(holdings.map(holding => holding.ticker)).size}</strong>
              </div>
              <div>
                <span>Ринкових цін</span>
                <strong>
                  {quotedCount} / {holdings.length}
                </strong>
              </div>
              <div>
                <span>Валюти</span>
                <strong>{summary.hasMixedCurrencies ? 'Кілька' : 'Одна'}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-heading">
            <div>
              <span>Останні операції</span>
              <h2>Журнал</h2>
            </div>
            <button className="text-action-button" type="button" onClick={onOpenLedger}>
              Відкрити
            </button>
          </div>
          <TransactionList transactions={transactions.slice(0, 4)} compact />
        </section>
      </aside>

      <section className="dashboard-card table-card">
        <div className="card-heading">
          <div>
            <span>Активи</span>
            <h2>Позиції за журналом</h2>
          </div>
          <small>{quotedCount > 0 ? 'З поточними цінами' : 'Очікує ціни API'}</small>
        </div>
        <HoldingsTable holdings={holdings.slice(0, 5)} marketQuotes={marketQuotes} />
      </section>

      <section className="dashboard-card action-card">
        <span>Наступний крок</span>
        <h2>Пошук активу + ціни</h2>
        <p>
          У журналі можна знайти актив по назві, підтягнути поточну ціну і
          залишити точну ціну угоди для історії та майбутнього FIFO.
        </p>
        <button className="primary-action-button" type="button" onClick={onOpenLedger}>
          Перейти до журналу
        </button>
      </section>
    </div>
  );
}

function LedgerModule({
  onAddTransaction,
  onDeleteTransaction,
  transactions,
}: {
  onAddTransaction: (transaction: LedgerTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  transactions: LedgerTransaction[];
}) {
  const [form, setForm] = useState<TransactionFormState>(() => createEmptyForm());
  const [error, setError] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState<MarketSearchResult[]>([]);
  const [assetSearchStatus, setAssetSearchStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [selectedAssetQuote, setSelectedAssetQuote] = useState<MarketQuote | null>(
    null
  );
  const [selectedAssetQuoteStatus, setSelectedAssetQuoteStatus] =
    useState<QuoteStatus>('idle');
  const isTrade = isTradeType(form.type);

  function updateForm<Value extends keyof TransactionFormState>(
    key: Value,
    value: TransactionFormState[Value]
  ) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function handleAssetSearch() {
    const query = assetSearchQuery.trim();

    if (query.length < 2) {
      setAssetSearchResults([]);
      setAssetSearchStatus('idle');
      return;
    }

    setAssetSearchStatus('loading');

    try {
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as unknown;

      if (!response.ok || !isRecord(payload)) {
        throw new Error('Search failed');
      }

      setAssetSearchResults(sanitizeSearchResults(payload.results));
      setAssetSearchStatus('ready');
    } catch {
      setAssetSearchResults([]);
      setAssetSearchStatus('error');
    }
  }

  async function loadSelectedAssetQuote(symbol: string, shouldFillPrice = false) {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!normalizedSymbol) {
      setSelectedAssetQuote(null);
      setSelectedAssetQuoteStatus('idle');
      return;
    }

    setSelectedAssetQuoteStatus('loading');

    try {
      const response = await fetch(
        `/api/market/quotes?symbols=${encodeURIComponent(normalizedSymbol)}`
      );
      const payload = (await response.json()) as unknown;

      if (!response.ok || !isRecord(payload)) {
        throw new Error('Quote update failed');
      }

      const quotes = sanitizeQuotes(payload.quotes);
      const quote = quotes[normalizedSymbol] ?? Object.values(quotes)[0] ?? null;

      if (!quote) {
        throw new Error('No quote found');
      }

      setSelectedAssetQuote(quote);
      setSelectedAssetQuoteStatus('ready');

      if (shouldFillPrice) {
        setForm(current => ({
          ...current,
          currency: normalizeCurrency(quote.currency || current.currency),
          price: toPriceInputValue(quote.price),
        }));
      }
    } catch {
      setSelectedAssetQuote(null);
      setSelectedAssetQuoteStatus('error');
    }
  }

  function selectAsset(result: MarketSearchResult) {
    setForm(current => ({
      ...current,
      assetName: result.name,
      currency: normalizeCurrency(result.currency),
      ticker: result.symbol.toUpperCase(),
    }));
    setAssetSearchQuery(`${result.symbol} · ${result.name}`);
    setAssetSearchResults([]);
    setAssetSearchStatus('idle');
    void loadSelectedAssetQuote(result.symbol, true);
  }

  function handleTickerChange(value: string) {
    updateForm('ticker', value);
    setSelectedAssetQuote(null);
    setSelectedAssetQuoteStatus('idle');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const quantity = parseNumber(form.quantity);
    const price = parseNumber(form.price);
    const amount = isTrade ? quantity * price : parseNumber(form.amount);
    const fee = parseNumber(form.fee);
    const ticker = form.ticker.trim().toUpperCase();

    if (!form.date) {
      setError('Вкажи дату операції.');
      return;
    }

    if (isTrade && (!ticker || quantity <= 0 || price <= 0)) {
      setError('Для купівлі або продажу потрібні тікер, кількість і ціна.');
      return;
    }

    if (!isTrade && amount <= 0) {
      setError('Для цієї операції потрібна сума.');
      return;
    }

    onAddTransaction({
      id: createId(),
      account: form.account,
      type: form.type,
      date: form.date,
      ticker,
      assetName: form.assetName.trim(),
      quantity: isTrade ? quantity : 0,
      price: isTrade ? price : 0,
      amount,
      currency: form.currency,
      fee,
      note: form.note.trim(),
    });

    setForm(current => ({
      ...createEmptyForm(),
      account: current.account,
      currency: current.currency,
      date: current.date,
      type: current.type,
    }));
  }

  return (
    <div className="ledger-layout">
      <section className="dashboard-card">
        <div className="card-heading">
          <div>
            <span>Нова операція</span>
            <h2>Додати запис</h2>
          </div>
        </div>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <label>
            Тип
            <select
              value={form.type}
              onChange={event =>
                updateForm('type', event.target.value as TransactionType)
              }
            >
              {transactionTypeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Акаунт
            <select
              value={form.account}
              onChange={event =>
                updateForm('account', event.target.value as BrokerAccountId)
              }
            >
              {brokerAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Дата
            <input
              type="date"
              value={form.date}
              onChange={event => updateForm('date', event.target.value)}
            />
          </label>

          <label>
            Валюта
            <select
              value={form.currency}
              onChange={event =>
                updateForm('currency', event.target.value as CurrencyCode)
              }
            >
              {currencyOptions.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          {isTrade ? (
            <>
              <div className="form-wide asset-search-box">
                <label>
                  Пошук активу
                  <span className="field-row">
                    <input
                      placeholder="Наприклад: Apple, Microsoft, Vanguard"
                      value={assetSearchQuery}
                      onChange={event => setAssetSearchQuery(event.target.value)}
                    />
                    <button
                      className="ghost-action-button"
                      type="button"
                      onClick={handleAssetSearch}
                    >
                      {assetSearchStatus === 'loading' ? 'Шукаю...' : 'Знайти'}
                    </button>
                  </span>
                </label>

                {assetSearchStatus === 'error' ? (
                  <p className="form-hint is-error">
                    Не вдалося виконати пошук. Перевір API keys або спробуй
                    пізніше.
                  </p>
                ) : null}

                {assetSearchResults.length > 0 ? (
                  <div className="asset-search-results">
                    {assetSearchResults.map(result => (
                      <button
                        key={`${result.symbol}-${result.exchange}-${result.provider}`}
                        type="button"
                        onClick={() => selectAsset(result)}
                      >
                        <strong>{result.symbol}</strong>
                        <span>{result.name}</span>
                        <small>
                          {[result.exchange, result.region, result.currency]
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <label>
                Тікер
                <input
                  placeholder="AAPL"
                  value={form.ticker}
                  onBlur={() => {
                    if (form.ticker.trim()) {
                      void loadSelectedAssetQuote(form.ticker, false);
                    }
                  }}
                  onChange={event => handleTickerChange(event.target.value)}
                />
              </label>

              <label>
                Назва
                <input
                  placeholder="Apple Inc."
                  value={form.assetName}
                  onChange={event => updateForm('assetName', event.target.value)}
                />
              </label>

              <label>
                Кількість
                <input
                  inputMode="decimal"
                  placeholder="10"
                  value={form.quantity}
                  onChange={event => updateForm('quantity', event.target.value)}
                />
              </label>

              <label>
                Ціна за 1 шт.
                <input
                  inputMode="decimal"
                  placeholder="175.20"
                  value={form.price}
                  onChange={event => updateForm('price', event.target.value)}
                />
              </label>

              <div className="form-wide live-price-card">
                <div>
                  <span className="live-price-kicker">Поточна ринкова ціна</span>
                  <strong>
                    {selectedAssetQuoteStatus === 'loading'
                      ? 'Підтягую ціну...'
                      : selectedAssetQuote
                        ? formatMoney(
                            selectedAssetQuote.price,
                            selectedAssetQuote.currency || form.currency
                          )
                        : 'Ще не підтягнуто'}
                  </strong>
                  <small>
                    {selectedAssetQuote
                      ? `${selectedAssetQuote.symbol} · ${
                          selectedAssetQuote.provider || 'market API'
                        }`
                      : 'Вибери актив у пошуку або введи тікер і вийди з поля.'}
                  </small>
                </div>
                <button
                  className="ghost-action-button"
                  type="button"
                  disabled={!selectedAssetQuote}
                  onClick={() => {
                    if (selectedAssetQuote) {
                      updateForm('price', toPriceInputValue(selectedAssetQuote.price));
                    }
                  }}
                >
                  Підставити
                </button>
              </div>

              {selectedAssetQuoteStatus === 'error' ? (
                <p className="form-hint is-error form-wide">
                  Не вдалося підтягнути поточну ціну. Це може бути ліміт API або
                  тікер, який провайдер не знайшов.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <label>
                Тікер
                <input
                  placeholder="Необовʼязково"
                  value={form.ticker}
                  onChange={event => updateForm('ticker', event.target.value)}
                />
              </label>

              <label>
                Сума
                <input
                  inputMode="decimal"
                  placeholder="1000"
                  value={form.amount}
                  onChange={event => updateForm('amount', event.target.value)}
                />
              </label>
            </>
          )}

          <label>
            Комісія
            <input
              inputMode="decimal"
              placeholder="0"
              value={form.fee}
              onChange={event => updateForm('fee', event.target.value)}
            />
          </label>

          <label className="form-wide">
            Нотатка
            <textarea
              placeholder="Чому була зроблена ця операція?"
              value={form.note}
              onChange={event => updateForm('note', event.target.value)}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-action-button form-wide" type="submit">
            Додати операцію
          </button>
        </form>
      </section>

      <section className="dashboard-card">
        <div className="card-heading">
          <div>
            <span>Операції</span>
            <h2>Локальний журнал</h2>
          </div>
          <small>{transactions.length} записів</small>
        </div>

        <TransactionList
          onDeleteTransaction={onDeleteTransaction}
          transactions={transactions}
        />
      </section>
    </div>
  );
}

function HoldingsModule({
  holdings,
  marketQuotes,
  onRefreshQuotes,
  quoteStatus,
  quoteUpdatedAt,
}: {
  holdings: HoldingRow[];
  marketQuotes: Record<string, MarketQuote>;
  onRefreshQuotes: () => void;
  quoteStatus: QuoteStatus;
  quoteUpdatedAt: string;
}) {
  const quotedCount = holdings.filter(
    holding => marketQuotes[holding.ticker.toUpperCase()]
  ).length;

  return (
    <div className="module-preview-grid">
      <section className="dashboard-card table-card">
        <div className="card-heading">
          <div>
            <span>Позиції</span>
            <h2>Активи за журналом</h2>
          </div>
          <div className="quote-toolbar">
            <small>
              {quotedCount > 0
                ? `${quotedCount} / ${holdings.length} з ринковою ціною`
                : 'Поточні ціни ще не підтягнуті'}
            </small>
            <button
              className="text-action-button"
              type="button"
              onClick={onRefreshQuotes}
            >
              {quoteStatus === 'loading' ? 'Оновлюю...' : 'Оновити ціни'}
            </button>
          </div>
        </div>
        {quoteUpdatedAt ? (
          <p className="quote-updated-note">
            Останнє оновлення: {new Date(quoteUpdatedAt).toLocaleString('uk-UA')}
          </p>
        ) : null}
        <HoldingsTable holdings={holdings} marketQuotes={marketQuotes} />
      </section>

      <section className="dashboard-card module-main-card">
        <span>Як це рахується</span>
        <h2>Купівлі мінус продажі</h2>
        <p>
          Зараз система бере операції з журналу, групує їх за тікером і валютою,
          рахує залишок кількості та середню ціну. Після оновлення цін вона
          також показує поточну вартість і нереалізований прибуток або збиток.
        </p>
      </section>
    </div>
  );
}

function ModulePreview({ activeId }: { activeId: NavigationId }) {
  const content = {
    taxes: {
      tag: 'FIFO',
      title: 'Податковий модуль піде після журналу',
      text: 'Для FIFO потрібні реальні лоти з журналу. Ми вже почали збирати ці лоти через операції купівлі та продажу.',
    },
    calendar: {
      tag: 'Календар',
      title: 'Нагадування без зайвого шуму',
      text: 'Тут будуть податкові дати, дивіденди, депозитні події та планове ребалансування.',
    },
    diary: {
      tag: 'Щоденник',
      title: 'Логіка рішень поруч з операціями',
      text: 'У журналі вже є поле нотатки. Пізніше винесемо ці записи в окремий щоденник.',
    },
    watchlist: {
      tag: 'Watchlist',
      title: 'Список ідей до покупки',
      text: 'Місце для активів, за якими ти стежиш: цільова ціна, коротка причина і майбутні сповіщення.',
    },
    settings: {
      tag: 'Налаштування',
      title: 'Брокери, валюта і джерела цін',
      text: 'Тут будемо додавати IBKR API, імпорт XTB-звітів, базову валюту, джерело курсів і правила приватності.',
    },
    dashboard: {
      tag: 'Дашборд',
      title: 'Зведення',
      text: 'Поточний розділ уже показаний як головна панель.',
    },
    holdings: {
      tag: 'Активи',
      title: 'Позиції',
      text: 'Поточний розділ активів має окремий екран.',
    },
    ledger: {
      tag: 'Журнал',
      title: 'Операції',
      text: 'Поточний розділ журналу має окремий екран.',
    },
  }[activeId];

  return (
    <div className="module-preview-grid">
      <section className="dashboard-card module-main-card">
        <span>{content.tag}</span>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
      </section>

      <section className="dashboard-card table-card">
        <div className="card-heading">
          <div>
            <span>Живий фундамент</span>
            <h2>Що вже працює</h2>
          </div>
        </div>
        <div className="clean-table">
          <div className="clean-table-row">
            <strong>Журнал</strong>
            <span>Додавання операцій і збереження в браузері</span>
          </div>
          <div className="clean-table-row">
            <strong>Акаунти</strong>
            <span>IBKR, XTB або зведення по всіх</span>
          </div>
          <div className="clean-table-row">
            <strong>Активи</strong>
            <span>Кількість, середня ціна і собівартість з журналу</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function HoldingsTable({
  holdings,
  marketQuotes,
}: {
  holdings: HoldingRow[];
  marketQuotes: Record<string, MarketQuote>;
}) {
  if (holdings.length === 0) {
    return (
      <div className="empty-ledger">
        <strong>Позицій ще немає</strong>
        <p>Додай купівлю в журналі, і вона зʼявиться тут автоматично.</p>
      </div>
    );
  }

  return (
    <div className="clean-table">
      {holdings.map(holding => (
        <HoldingTableRow
          holding={holding}
          key={holding.key}
          quote={marketQuotes[holding.ticker.toUpperCase()]}
        />
      ))}
    </div>
  );
}

function HoldingTableRow({
  holding,
  quote,
}: {
  holding: HoldingRow;
  quote?: MarketQuote;
}) {
  const marketValue = quote ? holding.quantity * quote.price : null;
  const pnl = marketValue === null ? null : marketValue - holding.cost;
  const pnlClassName =
    pnl === null ? '' : pnl >= 0 ? 'is-positive' : 'is-negative';

  return (
    <div className="clean-table-row holding-row">
      <strong>{holding.ticker}</strong>
      <span>{holding.assetName || 'Без назви'}</span>
      <span>{formatNumber(holding.quantity)} шт.</span>
      <span>{formatMoney(holding.averagePrice, holding.currency)}</span>
      <span>
        {quote
          ? formatMoney(quote.price, quote.currency || holding.currency)
          : 'Немає ціни'}
      </span>
      <span>
        {marketValue === null
          ? 'Очікує API'
          : formatMoney(marketValue, quote?.currency || holding.currency)}
      </span>
      <span className={pnlClassName}>
        {pnl === null ? '—' : formatMoney(pnl, quote?.currency || holding.currency)}
      </span>
    </div>
  );
}

function TransactionList({
  compact = false,
  onDeleteTransaction,
  transactions,
}: {
  compact?: boolean;
  onDeleteTransaction?: (id: string) => void;
  transactions: LedgerTransaction[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="empty-ledger">
        <strong>Операцій ще немає</strong>
        <p>Перший запис можна додати в розділі “Журнал”.</p>
      </div>
    );
  }

  return (
    <div className={compact ? 'transaction-list is-compact' : 'transaction-list'}>
      {transactions.map(transaction => (
        <article className="transaction-row" key={transaction.id}>
          <div className="transaction-main">
            <span className={`transaction-badge type-${transaction.type}`}>
              {getTypeLabel(transaction.type)}
            </span>
            <div>
              <strong>
                {transaction.ticker ||
                  (transaction.type === 'deposit'
                    ? 'Поповнення'
                    : transaction.type === 'withdrawal'
                      ? 'Виведення'
                      : 'Грошова операція')}
              </strong>
              <small>
                {getAccountLabel(transaction.account)} · {transaction.date}
              </small>
            </div>
          </div>

          <div className="transaction-values">
            {transaction.quantity > 0 ? (
              <span>{formatNumber(transaction.quantity)} шт.</span>
            ) : null}
            <strong>{formatMoney(transaction.amount, transaction.currency)}</strong>
            {transaction.fee > 0 ? <small>Комісія {transaction.fee}</small> : null}
          </div>

          {onDeleteTransaction ? (
            <button
              className="ghost-action-button"
              type="button"
              onClick={() => onDeleteTransaction(transaction.id)}
            >
              Видалити
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function RoomWorkspace({ user }: RoomWorkspaceProps) {
  const [activeNavId, setActiveNavId] = useState<NavigationId>('dashboard');
  const [activeAccountId, setActiveAccountId] = useState<AccountFilterId>('all');
  const [hasLoadedLedger, setHasLoadedLedger] = useState(false);
  const [marketQuotes, setMarketQuotes] = useState<Record<string, MarketQuote>>({});
  const [priceSnapshots, setPriceSnapshots] = useState<PriceSnapshot[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle');
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState('');
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const timeoutId = window.setTimeout(() => {
      if (saved) {
        try {
          setTransactions(sanitizeTransactions(JSON.parse(saved)));
        } catch {
          setTransactions([]);
        }
      }

      setHasLoadedLedger(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedLedger) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [hasLoadedLedger, transactions]);

  const scopedTransactions = useMemo(
    () => filterByAccount(transactions, activeAccountId),
    [activeAccountId, transactions]
  );
  const holdings = useMemo(
    () => calculateHoldings(scopedTransactions),
    [scopedTransactions]
  );
  const summary = useMemo(
    () => calculateSummary(scopedTransactions, holdings),
    [holdings, scopedTransactions]
  );
  const quoteSymbolsKey = useMemo(
    () =>
      Array.from(new Set(holdings.map(holding => holding.ticker.toUpperCase())))
        .filter(Boolean)
        .sort()
        .join(','),
    [holdings]
  );

  const refreshMarketQuotes = useCallback(
    async (quiet = false) => {
      const symbols = quoteSymbolsKey.split(',').filter(Boolean);

      if (symbols.length === 0) {
        setQuoteStatus('idle');
        return;
      }

      if (!quiet) {
        setQuoteStatus('loading');
      }

      try {
        const response = await fetch(
          `/api/market/quotes?symbols=${encodeURIComponent(symbols.join(','))}`
        );
        const payload = (await response.json()) as unknown;

        if (!response.ok || !isRecord(payload)) {
          throw new Error('Quote update failed');
        }

        const quotes = sanitizeQuotes(payload.quotes);
        const updatedAt = readString(payload.updatedAt) || new Date().toISOString();
        const currentValue = calculatePortfolioMarketValue(holdings, quotes);

        setMarketQuotes(quotes);
        setQuoteUpdatedAt(updatedAt);
        setQuoteStatus('ready');

        if (currentValue > 0) {
          setPriceSnapshots(current => {
            const lastSnapshot = current[current.length - 1];

            if (lastSnapshot?.id === updatedAt) {
              return current;
            }

            return [
              ...current,
              {
                id: updatedAt,
                value: currentValue,
                createdAt: updatedAt,
              },
            ].slice(-MAX_PRICE_SNAPSHOTS);
          });
        }
      } catch {
        setQuoteStatus('error');
      }
    },
    [holdings, quoteSymbolsKey]
  );

  useEffect(() => {
    if (!hasLoadedLedger || !quoteSymbolsKey) {
      return;
    }

    const firstRefreshId = window.setTimeout(() => {
      void refreshMarketQuotes(true);
    }, 500);
    const refreshIntervalId = window.setInterval(() => {
      void refreshMarketQuotes(true);
    }, AUTO_QUOTE_REFRESH_MS);

    return () => {
      window.clearTimeout(firstRefreshId);
      window.clearInterval(refreshIntervalId);
    };
  }, [hasLoadedLedger, quoteSymbolsKey, refreshMarketQuotes]);

  const activeNav =
    navigationItems.find(item => item.id === activeNavId) ?? navigationItems[0];
  const initials = getInitials(user?.name, user?.email);
  const liveMarketStatus =
    holdings.length === 0
      ? 'Додай актив для ринкових цін'
      : quoteStatus === 'loading'
        ? 'Оновлюю ринок...'
        : quoteStatus === 'ready'
          ? 'Ринкові ціни активні'
          : quoteStatus === 'error'
            ? 'Ціни не підтягнулись'
            : 'Очікую перше оновлення';

  function addTransaction(transaction: LedgerTransaction) {
    setTransactions(current =>
      [transaction, ...current].sort((left, right) =>
        right.date.localeCompare(left.date)
      )
    );
  }

  function deleteTransaction(id: string) {
    setTransactions(current => current.filter(transaction => transaction.id !== id));
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar" aria-label="Меню кабінету">
        <div className="dashboard-brand">
          <span className="brand-mark" aria-hidden="true">
            AR
          </span>
          <strong>Aqua Room</strong>
        </div>

        <nav className="dashboard-nav" aria-label="Розділи кабінету">
          {navigationItems.map(item => (
            <button
              className={item.id === activeNavId ? 'is-active' : ''}
              key={item.id}
              type="button"
              aria-pressed={item.id === activeNavId}
              onClick={() => setActiveNavId(item.id)}
            >
              <span>{item.marker}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-note">
          <span>Приватність</span>
          <p>
            Дані журналу зараз зберігаються тільки в браузері. У код і Git вони
            не потрапляють.
          </p>
        </div>

        <div className="dashboard-user-card">
          <span className="dashboard-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <strong>{user?.name ?? 'Приватний користувач'}</strong>
            <small>{user?.email ?? 'Вхід виконано'}</small>
          </div>
          <button type="button" onClick={() => signOut({ redirectTo: '/' })}>
            Вийти
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-kicker">Приватний кабінет</span>
            <h1>{activeNav.title}</h1>
            <p>{activeNav.subtitle}</p>
          </div>

          <div className="dashboard-controls" aria-label="Фільтри кабінету">
            <div className="account-tabs" aria-label="Перемикач акаунтів">
              {accountFilters.map(account => (
                <button
                  className={account.id === activeAccountId ? 'is-active' : ''}
                  key={account.id}
                  type="button"
                  aria-pressed={account.id === activeAccountId}
                  onClick={() => setActiveAccountId(account.id)}
                >
                  <span>{account.label}</span>
                  <small>{account.detail}</small>
                </button>
              ))}
            </div>
            <div
              className={`dashboard-status ${
                quoteStatus === 'ready' ? 'is-live' : ''
              }`}
            >
              {liveMarketStatus}
            </div>
          </div>
        </header>

        {activeNavId === 'dashboard' ? (
          <DashboardOverview
            holdings={holdings}
            marketQuotes={marketQuotes}
            onOpenLedger={() => setActiveNavId('ledger')}
            onRefreshQuotes={() => void refreshMarketQuotes()}
            priceSnapshots={priceSnapshots}
            quoteStatus={quoteStatus}
            quoteUpdatedAt={quoteUpdatedAt}
            summary={summary}
            transactions={scopedTransactions}
          />
        ) : null}

        {activeNavId === 'ledger' ? (
          <LedgerModule
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            transactions={scopedTransactions}
          />
        ) : null}

        {activeNavId === 'holdings' ? (
          <HoldingsModule
            holdings={holdings}
            marketQuotes={marketQuotes}
            onRefreshQuotes={() => void refreshMarketQuotes()}
            quoteStatus={quoteStatus}
            quoteUpdatedAt={quoteUpdatedAt}
          />
        ) : null}

        {!['dashboard', 'ledger', 'holdings'].includes(activeNavId) ? (
          <ModulePreview activeId={activeNavId} />
        ) : null}
      </section>
    </div>
  );
}
