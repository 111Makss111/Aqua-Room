import type {
  FilterDecision,
  FinalOpinion,
  NormalizedStockData,
  ProfitAnalysis,
} from './types';

function hasTrend(stock: NormalizedStockData) {
  const text = `${stock.sector} ${stock.industry} ${stock.shortDescription}`.toLowerCase();

  return ['ai', 'semiconductor', 'cloud', 'cybersecurity', 'data center'].some(term =>
    text.includes(term)
  );
}

function hasNegativeNews(stock: NormalizedStockData) {
  return stock.latestNews.some(news => {
    const text = `${news.sentiment} ${news.title} ${news.summary}`.toLowerCase();

    return text.includes('bearish') || text.includes('negative') || text.includes('risk');
  });
}

export function detectRedFlags(stock: NormalizedStockData, profit: ProfitAnalysis) {
  const redFlags: string[] = [];

  if ((stock.oneMonthPerformance ?? 0) > 50) redFlags.push('Акція виросла більш ніж на 50% за місяць.');
  if ((stock.oneYearPerformance ?? 0) > 100) redFlags.push('Акція виросла більш ніж на 100% за рік.');
  if ((stock.revenueGrowthYoY ?? 0) < 0) redFlags.push('Виручка падає рік до року.');
  if ((stock.earningsGrowthYoY ?? 0) < 0) redFlags.push('Прибуток падає рік до року.');
  if ((stock.peRatio ?? 0) > 60) redFlags.push('P/E виглядає дуже високим.');
  if ((stock.forwardPe ?? 0) > 45) redFlags.push('Forward P/E виглядає дорогим.');
  if ((stock.debtToEquity ?? 0) > 2) redFlags.push('Борг виглядає високим.');
  if ((stock.freeCashFlow ?? 1) < 0) redFlags.push('Free cash flow негативний.');
  if ((stock.netMargin ?? 0) < 0) redFlags.push('Компанія збиткова за чистою маржею.');
  if ((profit.profitPercent ?? 0) <= -30) redFlags.push('Падіння від ціни входу більше ніж на 30%.');
  if ((profit.profitPercent ?? 0) <= -20) redFlags.push('Падіння від ціни входу більше ніж на 20%.');
  if ((profit.profitPercent ?? 0) <= -10) redFlags.push('Падіння від ціни входу більше ніж на 10%.');
  if (hasNegativeNews(stock)) redFlags.push('Останні новини мають негативний або bearish тон.');

  return redFlags;
}

export function calculateRiskScore(stock: NormalizedStockData, profit: ProfitAnalysis) {
  let score = 45;

  if ((stock.revenueGrowthYoY ?? 0) > 10) score += 15;
  if ((stock.earningsGrowthYoY ?? 0) > 0) score += 15;
  if ((stock.freeCashFlow ?? 0) > 0) score += 10;
  if ((stock.peRatio ?? 999) > 0 && (stock.peRatio ?? 999) < 35) score += 10;
  if ((stock.debtToEquity ?? 0) > 0 && (stock.debtToEquity ?? 0) < 1.2) score += 10;
  if (hasTrend(stock)) score += 10;
  if ((stock.oneMonthPerformance ?? 0) > 0 && (stock.oneMonthPerformance ?? 0) < 35) score += 10;

  if ((stock.oneMonthPerformance ?? 0) > 50) score -= 20;
  if ((stock.oneYearPerformance ?? 0) > 100) score -= 15;
  if ((stock.revenueGrowthYoY ?? 0) < 0) score -= 15;
  if ((stock.earningsGrowthYoY ?? 0) < 0) score -= 15;
  if ((stock.freeCashFlow ?? 1) < 0) score -= 15;
  if ((stock.peRatio ?? 0) > 70 && (stock.revenueGrowthYoY ?? 0) < 15) score -= 20;
  if ((profit.profitPercent ?? 0) <= -20) score -= 15;
  if ((profit.profitPercent ?? 0) <= -30) score -= 25;

  return Math.min(100, Math.max(0, score));
}

export function generateFilterDecision(
  stock: NormalizedStockData,
  profit: ProfitAnalysis,
  riskScore: number
): FilterDecision {
  const weakGrowth = (stock.revenueGrowthYoY ?? 0) < 5 || (stock.earningsGrowthYoY ?? 0) < 0;
  const expensiveWeak = (stock.peRatio ?? 0) > 70 && (stock.revenueGrowthYoY ?? 0) < 15;
  const debtAndCash = (stock.freeCashFlow ?? 1) < 0 && (stock.debtToEquity ?? 0) > 1.8;

  if ((stock.oneMonthPerformance ?? 0) > 50 && weakGrowth) return 'Reject';
  if ((profit.profitPercent ?? 0) <= -30) return 'Reject';
  if ((stock.revenueGrowthYoY ?? 0) < 0 && (stock.earningsGrowthYoY ?? 0) < 0) return 'Reject';
  if (expensiveWeak || debtAndCash || riskScore < 35) return 'Reject';
  if (hasNegativeNews(stock) && riskScore < 55) return 'Reject';
  if ((profit.profitPercent ?? 0) <= -10 || (stock.peRatio ?? 0) > 45) return 'Warning';
  if ((stock.oneMonthPerformance ?? 0) > 35 || riskScore < 65) return 'Warning';

  return 'Pass';
}

export function generateFinalOpinion(
  filterDecision: FilterDecision,
  riskScore: number
): FinalOpinion {
  if (filterDecision === 'Reject') return riskScore < 30 ? 'High Risk / Speculative' : 'Avoid';
  if (filterDecision === 'Warning') return 'Hold';
  if (riskScore >= 82) return 'Strong Buy';
  if (riskScore >= 68) return 'Buy';

  return 'Hold';
}
