export type DashboardAccountOption = {
  id: string;
  label: string;
  detail: string;
};

export type DashboardHolding = {
  key: string;
  ticker: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  cost: number;
  currency: string;
};

export type DashboardQuote = {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  updatedAt: string;
};

export type DashboardSnapshot = {
  id: string;
  value: number;
  createdAt: string;
};

export type DashboardSummary = {
  cash: number;
  income: number;
  invested: number;
  holdingsCost: number;
  operationCount: number;
  hasMixedCurrencies: boolean;
};

export type DashboardTransaction = {
  id: string;
  account: string;
  type: string;
  ticker: string;
  amount: number;
  currency: string;
};

export type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error';
