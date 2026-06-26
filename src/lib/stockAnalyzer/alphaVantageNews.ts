import type { StockNewsItem } from './types';
import { fetchProviderJson, isRecord, readString } from './providerUtils';

function getAlphaApiKey() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
  }

  return apiKey;
}

function buildNewsUrl(symbol: string) {
  const url = new URL('https://www.alphavantage.co/query');

  url.searchParams.set('function', 'NEWS_SENTIMENT');
  url.searchParams.set('limit', '5');
  url.searchParams.set('tickers', symbol);
  url.searchParams.set('apikey', getAlphaApiKey());

  return url.toString();
}

export async function fetchStockNews(symbol: string): Promise<StockNewsItem[]> {
  try {
    const payload = await fetchProviderJson(buildNewsUrl(symbol));

    if (!isRecord(payload) || !Array.isArray(payload.feed)) {
      return [];
    }

    return payload.feed.slice(0, 5).flatMap(item => {
      if (!isRecord(item)) return [];

      return [{
        sentiment: readString(item.overall_sentiment_label),
        source: readString(item.source),
        summary: readString(item.summary),
        title: readString(item.title),
        url: readString(item.url),
      }];
    });
  } catch {
    return [];
  }
}
