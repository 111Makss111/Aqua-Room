import type { ProfitAnalysis, ProfitStatus } from './types';

export function calculateProfitPercent(
  currentPrice: number | null,
  entryPrice: number | null
) {
  if (!currentPrice || !entryPrice || entryPrice <= 0) {
    return null;
  }

  return ((currentPrice - entryPrice) / entryPrice) * 100;
}

export function calculateProfitAmount(
  currentPrice: number | null,
  entryPrice: number | null
) {
  if (!currentPrice || !entryPrice || entryPrice <= 0) {
    return null;
  }

  return currentPrice - entryPrice;
}

function getProfitStatus(profitPercent: number | null): ProfitStatus {
  if (profitPercent === null || Math.abs(profitPercent) < 0.25) {
    return 'neutral';
  }

  return profitPercent > 0 ? 'profit' : 'loss';
}

function getProfitExplanation(profitPercent: number | null) {
  if (profitPercent === null) {
    return 'Вкажи ціну входу, щоб система оцінила результат позиції.';
  }

  if (profitPercent <= -30) {
    return 'Просадка дуже глибока. Таку позицію варто перевірити особливо уважно.';
  }

  if (profitPercent <= -20) {
    return 'Просадка суттєва. Це вже не просто дрібний шум ринку.';
  }

  if (profitPercent <= -10) {
    return 'Є помітна просадка, але її ще потрібно порівняти з якістю бізнесу.';
  }

  if (profitPercent >= 25) {
    return 'Позиція має сильний прибуток. Важливо перевірити, чи немає перегріву.';
  }

  return 'Результат виглядає як нормальний ринковий рух без крайніх сигналів.';
}

export function buildProfitAnalysis(
  currentPrice: number | null,
  entryPrice: number | null
): ProfitAnalysis {
  const profitPercent = calculateProfitPercent(currentPrice, entryPrice);

  return {
    entryPrice,
    currentPrice,
    profitAmountPerShare: calculateProfitAmount(currentPrice, entryPrice),
    profitPercent,
    status: getProfitStatus(profitPercent),
    explanation: getProfitExplanation(profitPercent),
  };
}
