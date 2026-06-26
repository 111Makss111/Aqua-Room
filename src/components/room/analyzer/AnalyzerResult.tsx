import type { StockAnalysisResult } from '@/lib/stockAnalyzer/types';
import { formatLargeNumber, formatMoney, formatPercent, getDecisionTone } from './AnalyzerFormat';
import styles from './StockAnalyzer.module.css';

type AnalyzerResultProps = {
  result: StockAnalysisResult;
};

function ListBlock({ empty, items }: { empty: string; items: string[] }) {
  if (items.length === 0) {
    return <p className={styles.muted}>{empty}</p>;
  }

  return (
    <ul className={styles.cleanList}>
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AnalyzerResult({ result }: AnalyzerResultProps) {
  const { stock, profit } = result;
  const profitTone = getDecisionTone(profit.status);
  const decisionTone = getDecisionTone(result.filterDecision);

  return (
    <div className={styles.resultGrid}>
      <article className={styles.heroCard}>
        <span>{stock.ticker}</span>
        <h2>{stock.companyName}</h2>
        <p>{stock.sector || 'Сектор не вказаний'} · {stock.industry || 'Індустрія не вказана'}</p>
      </article>

      <article className={styles.card}>
        <span>Поточний результат</span>
        <strong className={styles[profitTone]}>{formatPercent(profit.profitPercent)}</strong>
        <p>Вхід: {formatMoney(profit.entryPrice)} · зараз: {formatMoney(stock.currentPrice)}</p>
        <p>{profit.explanation}</p>
      </article>

      <article className={styles.card}>
        <span>Фундаментальні дані</span>
        <div className={styles.metricList}>
          <p>Market cap: {formatLargeNumber(stock.marketCap)}</p>
          <p>P/E: {stock.peRatio ?? 'Немає даних'}</p>
          <p>Forward P/E: {stock.forwardPe ?? 'Немає даних'}</p>
          <p>Revenue YoY: {formatPercent(stock.revenueGrowthYoY)}</p>
          <p>Earnings YoY: {formatPercent(stock.earningsGrowthYoY)}</p>
        </div>
      </article>

      <article className={styles.card}>
        <span>Що це за компанія</span>
        <p>{result.companyOverview}</p>
      </article>

      <article className={styles.card}>
        <span>Чому могла бути обрана</span>
        <ListBlock empty="Сильних автоматичних причин не знайдено." items={result.selectionReasons} />
      </article>

      <article className={styles.card}>
        <span>Червоні прапорці</span>
        <ListBlock empty="Критичних прапорців за доступними даними немає." items={result.redFlags} />
      </article>

      <article className={styles.card}>
        <span>Risk Score</span>
        <strong>{result.riskScore}/100</strong>
        <div className={styles.scoreBar}><i style={{ width: `${result.riskScore}%` }} /></div>
      </article>

      <article className={styles.card}>
        <span>Filter Decision</span>
        <strong className={styles[decisionTone]}>{result.filterDecision}</strong>
        <p>Фінальний висновок: {result.finalOpinion}</p>
        <p>{result.finalExplanation}</p>
      </article>

      <article className={styles.card}>
        <span>Latest News</span>
        <ListBlock
          empty="Новини від провайдера зараз недоступні."
          items={stock.latestNews.map(news => `${news.title} (${news.sentiment || news.source})`)}
        />
      </article>
    </div>
  );
}
