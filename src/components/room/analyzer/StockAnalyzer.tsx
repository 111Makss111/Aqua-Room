import { useState } from 'react';
import type { MonthlyFilterResult as MonthlyFilterResultType } from '@/lib/stockAnalyzer/types';
import { MonthlyFilterResult } from './MonthlyFilterResult';
import styles from './StockAnalyzer.module.css';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function StockAnalyzer() {
  const [budget, setBudget] = useState('300');
  const [candidates, setCandidates] = useState('MRVL HIMX AAPL AMD');
  const [result, setResult] = useState<MonthlyFilterResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleAnalyze() {
    if (!candidates.trim()) {
      setErrorMessage('Додай список тікерів для перевірки.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/stocks/filter', {
        body: JSON.stringify({ budget, candidates }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = (await response.json()) as unknown;

      if (!isRecord(payload)) {
        throw new Error('Не вдалося прочитати відповідь сервера.');
      }

      if (!response.ok) {
        throw new Error(String(payload.error || 'Не вдалося виконати фільтр.'));
      }

      if (!isRecord(payload.result)) {
        throw new Error('Сервер не повернув результат фільтра.');
      }

      setResult(payload.result as MonthlyFilterResultType);
    } catch (error) {
      setResult(null);
      setErrorMessage(
        error instanceof Error ? error.message : 'Не вдалося виконати фільтр.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.inputCard}>
        <div>
          <span>Risk Filter</span>
          <h2>Місячний фільтр акцій</h2>
          <p>
            Встав список ідей з Investing.com. Система відсіє ризикові акції та
            розділить бюджет тільки між тими, що пройшли фільтр.
          </p>
        </div>

        <label>
          Місячний бюджет
          <input
            inputMode="decimal"
            onChange={event => setBudget(event.target.value)}
            placeholder="300"
            value={budget}
          />
        </label>

        <label>
          Тікери або компанії
          <textarea
            onChange={event => setCandidates(event.target.value)}
            placeholder="MRVL HIMX AAPL AMD"
            value={candidates}
          />
        </label>

        <button type="button" onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? 'Аналізую...' : 'Проаналізувати список'}
        </button>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      </section>

      {result ? <MonthlyFilterResult result={result} /> : null}
    </div>
  );
}
