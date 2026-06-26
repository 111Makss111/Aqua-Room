import type { MonthlyFilterResult as MonthlyFilterResultType } from '@/lib/stockAnalyzer/types';
import { formatMoney, getDecisionLabel, getDecisionTone, getRiskLabel } from './AnalyzerFormat';
import styles from './StockAnalyzer.module.css';
import tableStyles from './MonthlyFilterResult.module.css';

type MonthlyFilterResultProps = {
  result: MonthlyFilterResultType;
};

function compactReasons(items: string[]) {
  return items.length > 0 ? items.join(' · ') : 'Немає сильних позитивних причин.';
}

function compactWarnings(items: string[]) {
  return items.length > 0 ? items.join(' · ') : 'Критичних ризиків не знайдено.';
}

export function MonthlyFilterResult({ result }: MonthlyFilterResultProps) {
  const buyCandidates = result.candidates.filter(candidate => candidate.decision === 'buy');

  return (
    <div className={styles.resultGrid}>
      <article className={styles.summaryCard}>
        <span>Місячний план</span>
        <strong>{formatMoney(result.budget)}</strong>
        <p>
          Пройшли фільтр: {result.buyCount}. На кожну покупку:{' '}
          {formatMoney(result.allocationPerStock)}.
        </p>
      </article>

      <article className={styles.summaryCard}>
        <span>Купити</span>
        <strong>{buyCandidates.length}</strong>
        <p>
          Купуються тільки акції з достатнім score і без високого рівня ризику.
        </p>
      </article>

      <article className={styles.summaryCard}>
        <span>Відсіяно</span>
        <strong>{result.rejected.length}</strong>
        <p>Ці активи залишаються у watch / avoid, доки ризики не покращаться.</p>
      </article>

      <section className={tableStyles.tableCard}>
        <div className={tableStyles.tableHeader}>
          <span>Фільтр кандидатів</span>
          <small>score · risk · decision</small>
        </div>

        <div className={tableStyles.candidateTable}>
          {result.candidates.map(candidate => {
            const tone = getDecisionTone(candidate.decision);

            return (
              <article className={tableStyles.candidateRow} key={candidate.symbol}>
                <div>
                  <strong>{candidate.symbol}</strong>
                  <small>{candidate.companyName}</small>
                </div>
                <div>
                  <strong>{candidate.score}/100</strong>
                  <small>Risk: {getRiskLabel(candidate.riskLevel)}</small>
                </div>
                <strong className={styles[tone]}>{getDecisionLabel(candidate.decision)}</strong>
                <div>
                  <strong>{formatMoney(candidate.investmentAmount)}</strong>
                  <small>Поточна ціна: {formatMoney(candidate.currentPrice)}</small>
                </div>
                <p>{compactReasons(candidate.reasons)}</p>
                <p>{compactWarnings(candidate.warnings)}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
