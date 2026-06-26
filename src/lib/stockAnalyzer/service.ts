import { searchMarketSymbols } from '@/lib/marketData';
import { detectRedFlags, calculateRiskScore, generateFilterDecision, generateFinalOpinion } from './analysis';
import { fetchStockData } from './alphaVantage';
import { buildProfitAnalysis } from './math';
import { buildCompanyOverview, buildFinalExplanation, buildSelectionReasons } from './narrative';

async function resolveTickerSymbol(query: string) {
  const normalizedQuery = query.trim().toUpperCase();

  if (!normalizedQuery) {
    return '';
  }

  const matches = await searchMarketSymbols(normalizedQuery);
  const exactMatch = matches.find(match => match.symbol.toUpperCase() === normalizedQuery);

  return (exactMatch ?? matches[0])?.symbol.toUpperCase() ?? normalizedQuery;
}

export async function analyzeStock(query: string, entryPrice: number | null) {
  const tickerSymbol = await resolveTickerSymbol(query);

  if (!tickerSymbol) {
    throw new Error('Ticker is required');
  }

  const stock = await fetchStockData(tickerSymbol);

  if (!stock.currentPrice && !stock.shortDescription) {
    throw new Error('Ticker was not found');
  }

  const profit = buildProfitAnalysis(stock.currentPrice, entryPrice);
  const redFlags = detectRedFlags(stock, profit);
  const riskScore = calculateRiskScore(stock, profit);
  const filterDecision = generateFilterDecision(stock, profit, riskScore);
  const finalOpinion = generateFinalOpinion(filterDecision, riskScore);

  return {
    companyOverview: buildCompanyOverview(stock),
    filterDecision,
    finalExplanation: buildFinalExplanation(stock, profit, finalOpinion),
    finalOpinion,
    profit,
    redFlags,
    riskScore,
    selectionReasons: buildSelectionReasons(stock),
    stock,
  };
}
