import { NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/stockAnalyzer/service';

function readEntryPrice(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(',', '.'));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? '';
  const entryPrice = readEntryPrice(searchParams.get('entryPrice'));

  if (query.trim().length < 1) {
    return NextResponse.json(
      { error: 'Введи тікер або назву компанії.' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeStock(query, entryPrice);

    return NextResponse.json({ analysis });
  } catch (error) {
    const errorText = error instanceof Error ? error.message : '';
    const isMissingKey = errorText.includes('ALPHA_VANTAGE_API_KEY');
    const message = isMissingKey
      ? 'Не додано Alpha Vantage API key для аналізу акцій.'
      : errorText === 'Ticker was not found'
        ? 'Не вдалося отримати дані по цьому тікеру. Перевір тікер або ліміт API.'
        : 'Не вдалося виконати аналіз акції.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
