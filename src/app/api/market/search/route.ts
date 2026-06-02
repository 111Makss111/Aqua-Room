import { NextResponse } from 'next/server';
import { searchMarketSymbols } from '@/lib/marketData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';

  try {
    const results = await searchMarketSymbols(query);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося виконати пошук активів.', results: [] },
      { status: 502 }
    );
  }
}
