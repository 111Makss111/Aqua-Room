import { useState } from 'react';
import type { StockAnalysisResult } from '@/lib/stockAnalyzer/types';
import { AnalyzerResult } from './AnalyzerResult';
import styles from './StockAnalyzer.module.css';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function StockAnalyzer() {
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [result, setResult] = useState<StockAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleAnalyze() {
    const query = tickerSymbol.trim();

    if (!query) {
      setErrorMessage('Введи тікер або назву компанії.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams({ query });

      if (entryPrice.trim()) params.set('entryPrice', entryPrice.trim());

      const response = await fetch(`/api/stocks/analyze?${params.toString()}`);
      const payload = (await response.json()) as unknown;

      if (!response.ok || !isRecord(payload)) {
        throw new Error('Analyze failed');
      }

      if (!isRecord(payload.analysis)) {
        throw new Error(String(payload.error || 'Тікер не знайдено.'));
      }

      setResult(payload.analysis as StockAnalysisResult);
    } catch (error) {
      setResult(null);
      setErrorMessage(
        error instanceof Error ? error.message : 'Не вдалося виконати аналіз.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.inputCard}>
        <div>
          <span>Stock Analyzer</span>
          <h2>Аналіз акції перед рішенням</h2>
          <p>Введи тікер або назву компанії та свою ціну входу.</p>
        </div>

        <label>
          Тікер або компанія
          <input value={tickerSymbol} onChange={event => setTickerSymbol(event.target.value)} placeholder="HIMX, ARM, QCOM, AMD" />
        </label>

        <label>
          Ціна входу
          <input inputMode="decimal" value={entryPrice} onChange={event => setEntryPrice(event.target.value)} placeholder="21.91" />
        </label>

        <button type="button" onClick={handleAnalyze} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      </section>

      {result ? <AnalyzerResult result={result} /> : null}
    </div>
  );
}
