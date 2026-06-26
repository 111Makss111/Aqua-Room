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
    const message =
      error instanceof Error && error.message === 'Ticker was not found'
        ? 'Тікер не знайдено або провайдер не повернув дані.'
        : 'Не вдалося виконати аналіз акції.';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
