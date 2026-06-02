import { NextResponse } from 'next/server';
import { quoteMarketSymbol } from '@/lib/marketData';

const MAX_SYMBOLS_PER_REQUEST = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get('symbols') ?? '')
    .split(',')
    .map(symbol => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS_PER_REQUEST);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: {}, updatedAt: new Date().toISOString() });
  }

  try {
    const quotes = await Promise.all(
      symbols.map(async symbol => [symbol, await quoteMarketSymbol(symbol)] as const)
    );

    return NextResponse.json({
      quotes: Object.fromEntries(quotes.filter(([, quote]) => quote !== null)),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося оновити ринкові ціни.', quotes: {} },
      { status: 502 }
    );
  }
}
