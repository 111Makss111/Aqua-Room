import { analyzeStock } from './service';
import type {
  MonthlyDecision,
  MonthlyFilterResult,
  RiskLevel,
  StockAnalysisResult,
  StockCandidateResult,
} from './types';

const MAX_MONTHLY_CANDIDATES = 12;

function parseCandidateList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map(item => item.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, MAX_MONTHLY_CANDIDATES);
}

function detectRiskLevel(analysis: StockAnalysisResult): RiskLevel {
  const hardWarnings = analysis.redFlags.filter(flag =>
    /падає|збиткова|негатив|борг|дорог|висок|50%|100%|30%/i.test(flag)
  );

  if (analysis.riskScore < 55 || hardWarnings.length >= 3) {
    return 'high';
  }

  return analysis.riskScore >= 75 && hardWarnings.length === 0 ? 'low' : 'medium';
}

function decide(score: number, riskLevel: RiskLevel): MonthlyDecision {
  if (score >= 75 && riskLevel !== 'high') {
    return 'buy';
  }

  if (score >= 55 && score <= 74 && riskLevel !== 'high') {
    return 'watch';
  }

  return 'avoid';
}

function buildReasons(analysis: StockAnalysisResult) {
  if (analysis.selectionReasons.length > 0) {
    return analysis.selectionReasons.slice(0, 3);
  }

  return ['Даних достатньо тільки для базової перевірки ризику.'];
}

function buildWarnings(analysis: StockAnalysisResult) {
  const warnings = [...analysis.redFlags];

  if (!analysis.stock.shortDescription || analysis.stock.marketCap === null) {
    warnings.unshift('Фундаментальні дані неповні, тому акція не може пройти фільтр впевнено.');
  }

  return warnings.slice(0, 4);
}

function toCandidateResult(analysis: StockAnalysisResult): StockCandidateResult {
  const riskLevel = detectRiskLevel(analysis);
  const decision = decide(analysis.riskScore, riskLevel);

  return {
    symbol: analysis.stock.ticker,
    companyName: analysis.stock.companyName,
    currentPrice: analysis.stock.currentPrice,
    decision,
    investmentAmount: 0,
    reasons: buildReasons(analysis),
    riskLevel,
    score: analysis.riskScore,
    warnings: buildWarnings(analysis),
  };
}

async function analyzeCandidate(symbol: string): Promise<StockCandidateResult> {
  try {
    return toCandidateResult(await analyzeStock(symbol, null));
  } catch {
    return {
      symbol,
      companyName: symbol,
      currentPrice: null,
      decision: 'avoid',
      investmentAmount: 0,
      reasons: [],
      riskLevel: 'high',
      score: 0,
      warnings: ['Провайдер не повернув надійні дані для цього тікера.'],
    };
  }
}

export async function filterMonthlyCandidates(
  rawCandidates: string,
  budget: number
): Promise<MonthlyFilterResult> {
  const symbols = parseCandidateList(rawCandidates);
  const candidates = await Promise.all(symbols.map(symbol => analyzeCandidate(symbol)));
  const buyCandidates = candidates.filter(candidate => candidate.decision === 'buy');
  const allocationPerStock = buyCandidates.length > 0 ? budget / buyCandidates.length : 0;

  const allocatedCandidates = candidates.map(candidate => ({
    ...candidate,
    investmentAmount: candidate.decision === 'buy' ? allocationPerStock : 0,
  }));

  return {
    allocationPerStock,
    budget,
    buyCount: buyCandidates.length,
    candidates: allocatedCandidates,
    rejected: allocatedCandidates.filter(candidate => candidate.decision !== 'buy'),
  };
}
