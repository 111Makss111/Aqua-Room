import { fetchStockNews } from './alphaVantageNews';
import type { NormalizedStockData, StockNewsItem } from './types';
import { fetchProviderJson, isRecord, readNumber, readString } from './providerUtils';

type PerformanceSet = {
  oneMonthPerformance: number | null;
  threeMonthPerformance: number | null;
  oneYearPerformance: number | null;
};

function getAlphaApiKey() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
  }

  return apiKey;
}

function buildAlphaUrl(params: Record<string, string>) {
  const url = new URL('https://www.alphavantage.co/query');

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('apikey', getAlphaApiKey());

  return url.toString();
}

function toPercent(value: number | null) {
  return value === null ? null : value * 100;
}

function changePercent(current: number | null, previous: number | null) {
  if (!current || !previous || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function getPerformanceFromSeries(payload: unknown, targetIndex: number) {
  if (!isRecord(payload) || !isRecord(payload['Time Series (Daily)'])) {
    return null;
  }

  const rows = Object.entries(payload['Time Series (Daily)']);
  const currentClose = readNumber(isRecord(rows[0]?.[1]) ? rows[0][1]['4. close'] : null);
  const pastClose = readNumber(
    isRecord(rows[targetIndex]?.[1]) ? rows[targetIndex][1]['4. close'] : null
  );

  return changePercent(currentClose, pastClose);
}

async function fetchOverview(symbol: string) {
  return fetchProviderJson(
    buildAlphaUrl({
      function: 'OVERVIEW',
      symbol,
    })
  );
}

async function fetchQuote(symbol: string) {
  const payload = await fetchProviderJson(
    buildAlphaUrl({
      function: 'GLOBAL_QUOTE',
      symbol,
    })
  );

  return isRecord(payload) && isRecord(payload['Global Quote'])
    ? payload['Global Quote']
    : {};
}

async function fetchPerformance(symbol: string): Promise<PerformanceSet> {
  try {
    const payload = await fetchProviderJson(
      buildAlphaUrl({
        function: 'TIME_SERIES_DAILY',
        outputsize: 'full',
        symbol,
      })
    );

    return {
      oneMonthPerformance: getPerformanceFromSeries(payload, 21),
      oneYearPerformance: getPerformanceFromSeries(payload, 252),
      threeMonthPerformance: getPerformanceFromSeries(payload, 63),
    };
  } catch {
    return {
      oneMonthPerformance: null,
      oneYearPerformance: null,
      threeMonthPerformance: null,
    };
  }
}

export function normalizeStockData(
  symbol: string,
  overview: unknown,
  quote: Record<string, unknown>,
  performance: PerformanceSet,
  latestNews: StockNewsItem[]
): NormalizedStockData {
  const data = isRecord(overview) ? overview : {};

  return {
    analystRating: readString(data.AnalystRating),
    companyName: readString(data.Name) || symbol,
    currentPrice: readNumber(quote['05. price']),
    debtToEquity: null,
    earningsGrowthYoY: toPercent(readNumber(data.QuarterlyEarningsGrowthYOY)),
    fiftyTwoWeekHigh: readNumber(data['52WeekHigh']),
    fiftyTwoWeekLow: readNumber(data['52WeekLow']),
    forwardPe: readNumber(data.ForwardPE),
    freeCashFlow: null,
    grossMargin: null,
    industry: readString(data.Industry),
    latestNews,
    marketCap: readNumber(data.MarketCapitalization),
    netMargin: toPercent(readNumber(data.ProfitMargin)),
    oneMonthPerformance: performance.oneMonthPerformance,
    oneYearPerformance: performance.oneYearPerformance,
    peRatio: readNumber(data.PERatio) ?? readNumber(data.TrailingPE),
    previousClose: readNumber(quote['08. previous close']),
    revenueGrowthYoY: toPercent(readNumber(data.QuarterlyRevenueGrowthYOY)),
    sector: readString(data.Sector),
    shortDescription: readString(data.Description),
    ticker: symbol,
    threeMonthPerformance: performance.threeMonthPerformance,
  };
}

export async function fetchStockData(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const [overview, quote, performance, news] = await Promise.all([
    fetchOverview(normalizedSymbol),
    fetchQuote(normalizedSymbol),
    fetchPerformance(normalizedSymbol),
    fetchStockNews(normalizedSymbol),
  ]);

  return normalizeStockData(normalizedSymbol, overview, quote, performance, news);
}
