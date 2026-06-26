export type FilterDecision = 'Pass' | 'Warning' | 'Reject';
export type FinalOpinion = 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid' | 'High Risk / Speculative';
export type ProfitStatus = 'profit' | 'loss' | 'neutral';
export type MonthlyDecision = 'buy' | 'watch' | 'avoid';
export type RiskLevel = 'low' | 'medium' | 'high';

export type StockNewsItem = {
  title: string;
  url: string;
  source: string;
  summary: string;
  sentiment: string;
};

export type NormalizedStockData = {
  ticker: string;
  companyName: string;
  currentPrice: number | null;
  previousClose: number | null;
  marketCap: number | null;
  sector: string;
  industry: string;
  peRatio: number | null;
  forwardPe: number | null;
  revenueGrowthYoY: number | null;
  earningsGrowthYoY: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
  freeCashFlow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  oneMonthPerformance: number | null;
  threeMonthPerformance: number | null;
  oneYearPerformance: number | null;
  analystRating: string;
  shortDescription: string;
  latestNews: StockNewsItem[];
};

export type ProfitAnalysis = {
  entryPrice: number | null;
  currentPrice: number | null;
  profitPercent: number | null;
  profitAmountPerShare: number | null;
  status: ProfitStatus;
  explanation: string;
};

export type StockAnalysisResult = {
  stock: NormalizedStockData;
  profit: ProfitAnalysis;
  companyOverview: string;
  selectionReasons: string[];
  redFlags: string[];
  riskScore: number;
  filterDecision: FilterDecision;
  finalOpinion: FinalOpinion;
  finalExplanation: string;
};

export type StockCandidateResult = {
  symbol: string;
  companyName: string;
  currentPrice: number | null;
  score: number;
  riskLevel: RiskLevel;
  decision: MonthlyDecision;
  investmentAmount: number;
  reasons: string[];
  warnings: string[];
};

export type MonthlyFilterResult = {
  budget: number;
  buyCount: number;
  allocationPerStock: number;
  candidates: StockCandidateResult[];
  rejected: StockCandidateResult[];
};
