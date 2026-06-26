export function formatMoney(value: number | null) {
  if (value === null) return 'Немає даних';

  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number | null) {
  if (value === null) return 'Немає даних';

  return new Intl.NumberFormat('uk-UA', {
    compactDisplay: 'short',
    maximumFractionDigits: 2,
    notation: 'compact',
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) return 'Немає даних';

  const sign = value > 0 ? '+' : '';

  return `${sign}${value.toFixed(2)}%`;
}

export function getDecisionTone(value: string) {
  if (value === 'Pass' || value === 'profit') return 'pass';
  if (value === 'Warning' || value === 'neutral') return 'warning';

  return 'reject';
}
