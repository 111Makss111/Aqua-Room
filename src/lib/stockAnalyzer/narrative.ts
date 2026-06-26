import type { FinalOpinion, NormalizedStockData, ProfitAnalysis } from './types';

function percent(value: number | null) {
  if (value === null) return 'немає даних';

  return `${value.toFixed(1)}%`;
}

export function buildCompanyOverview(stock: NormalizedStockData) {
  const sector = stock.sector || 'сектор не вказаний';
  const industry = stock.industry || 'індустрія не вказана';

  return `${stock.companyName} працює у секторі ${sector}, індустрія: ${industry}. ${
    stock.shortDescription || 'Опис бізнесу від провайдера поки недоступний.'
  }`;
}

export function buildSelectionReasons(stock: NormalizedStockData) {
  const reasons: string[] = [];

  if ((stock.oneMonthPerformance ?? 0) > 15) reasons.push('сильний короткостроковий momentum');
  if ((stock.revenueGrowthYoY ?? 0) > 10) reasons.push('зростання виручки рік до року');
  if ((stock.earningsGrowthYoY ?? 0) > 0) reasons.push('позитивна динаміка прибутку');
  if ((stock.forwardPe ?? 999) < (stock.peRatio ?? 0)) reasons.push('ринок очікує дешевшу оцінку вперед');
  if (stock.analystRating) reasons.push(`аналітичний сигнал: ${stock.analystRating}`);

  return reasons.length > 0 ? reasons : ['потрібна ручна перевірка причини додавання'];
}

export function buildFinalExplanation(
  stock: NormalizedStockData,
  profit: ProfitAnalysis,
  finalOpinion: FinalOpinion
){
  if (finalOpinion.includes('High Risk')) {
    return `${stock.ticker} виглядає спекулятивно: просадка ${percent(
      profit.profitPercent
    )}, а фундаментальні ризики потребують обережності.`;
  }

  if (finalOpinion === 'Avoid') {
    return `${stock.ticker} краще відсіяти перед покупкою або переглянути розмір позиції.`;
  }

  if (finalOpinion === 'Hold') {
    return `${stock.ticker} не виглядає однозначно погано, але є сигнали для уважного контролю.`;
  }

  return `${stock.ticker} має прийнятну комбінацію якості, росту й ризику, але рішення все одно треба звірити з власною стратегією.`;
}
