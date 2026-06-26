const STOCK_ANALYZER_TIMEOUT_MS = 7500;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function readNumber(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchProviderJson(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STOCK_ANALYZER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Stock provider returned ${response.status}`);
    }

    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeoutId);
  }
}
