export type MarketProvider = 'twelve-data' | 'alpha-vantage';

export type MarketSearchResult = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  region: string;
  type: string;
  provider: MarketProvider;
};

export type MarketQuote = {
  symbol: string;
  price: number;
  currency: string;
  provider: MarketProvider;
  updatedAt: string;
};

type TwelveSearchItem = {
  symbol?: string;
  instrument_name?: string;
  name?: string;
  currency?: string;
  exchange?: string;
  country?: string;
  type?: string;
};

type AlphaSearchItem = {
  '1. symbol'?: string;
  '2. name'?: string;
  '3. type'?: string;
  '4. region'?: string;
  '8. currency'?: string;
};

const MARKET_TIMEOUT_MS = 6500;

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MARKET_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Market provider returned ${response.status}`);
    }

    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mergeSearchResults(results: MarketSearchResult[]) {
  const unique = new Map<string, MarketSearchResult>();

  results.forEach(result => {
    const key = `${result.symbol}-${result.exchange}-${result.currency}`.toUpperCase();

    if (!unique.has(key)) {
      unique.set(key, result);
    }
  });

  return Array.from(unique.values()).slice(0, 12);
}

export async function searchTwelveData(
  query: string
): Promise<MarketSearchResult[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return [];
  }

  const url = new URL('https://api.twelvedata.com/symbol_search');
  url.searchParams.set('symbol', query);
  url.searchParams.set('outputsize', '10');
  url.searchParams.set('apikey', apiKey);

  const payload = await fetchJson(url.toString());

  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data.flatMap((item: TwelveSearchItem) => {
    const symbol = getString(item.symbol);

    if (!symbol) {
      return [];
    }

    return [
      {
        symbol,
        name: getString(item.instrument_name) || getString(item.name) || symbol,
        currency: getString(item.currency) || 'USD',
        exchange: getString(item.exchange),
        region: getString(item.country),
        type: getString(item.type),
        provider: 'twelve-data' as const,
      },
    ];
  });
}

export async function searchAlphaVantage(
  query: string
): Promise<MarketSearchResult[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'SYMBOL_SEARCH');
  url.searchParams.set('keywords', query);
  url.searchParams.set('apikey', apiKey);

  const payload = await fetchJson(url.toString());

  if (!isRecord(payload) || !Array.isArray(payload.bestMatches)) {
    return [];
  }

  return payload.bestMatches.flatMap((item: AlphaSearchItem) => {
    const symbol = getString(item['1. symbol']);

    if (!symbol) {
      return [];
    }

    return [
      {
        symbol,
        name: getString(item['2. name']) || symbol,
        currency: getString(item['8. currency']) || 'USD',
        exchange: '',
        region: getString(item['4. region']),
        type: getString(item['3. type']),
        provider: 'alpha-vantage' as const,
      },
    ];
  });
}

export async function searchMarketSymbols(query: string) {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const settledResults = await Promise.allSettled([
    searchTwelveData(trimmedQuery),
    searchAlphaVantage(trimmedQuery),
  ]);

  return mergeSearchResults(
    settledResults.flatMap(result =>
      result.status === 'fulfilled' ? result.value : []
    )
  );
}

export async function quoteTwelveData(symbol: string): Promise<MarketQuote | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = new URL('https://api.twelvedata.com/price');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);

  const payload = await fetchJson(url.toString());

  if (!isRecord(payload)) {
    return null;
  }

  const price = getNumber(payload.price);

  if (price === null) {
    return null;
  }

  return {
    symbol,
    price,
    currency: 'USD',
    provider: 'twelve-data',
    updatedAt: new Date().toISOString(),
  };
}

export async function quoteAlphaVantage(symbol: string): Promise<MarketQuote | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return null;
  }

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'GLOBAL_QUOTE');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);

  const payload = await fetchJson(url.toString());

  if (!isRecord(payload) || !isRecord(payload['Global Quote'])) {
    return null;
  }

  const quote = payload['Global Quote'];
  const price = getNumber(quote['05. price']);

  if (price === null) {
    return null;
  }

  return {
    symbol,
    price,
    currency: 'USD',
    provider: 'alpha-vantage',
    updatedAt: new Date().toISOString(),
  };
}

export async function quoteMarketSymbol(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    return null;
  }

  try {
    const twelveQuote = await quoteTwelveData(normalizedSymbol);

    if (twelveQuote) {
      return twelveQuote;
    }
  } catch {
    // Fallback below.
  }

  try {
    return await quoteAlphaVantage(normalizedSymbol);
  } catch {
    return null;
  }
}
