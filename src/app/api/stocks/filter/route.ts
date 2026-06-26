import { NextResponse } from 'next/server';
import { filterMonthlyCandidates } from '@/lib/stockAnalyzer/monthlyFilter';

function readBudget(value: unknown) {
  const parsed = Number(String(value ?? '').replace(',', '.'));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function readCandidates(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Не вдалося прочитати список.' }, { status: 400 });
  }

  const body = typeof payload === 'object' && payload !== null ? payload : {};
  const budget = readBudget('budget' in body ? body.budget : null);
  const candidates = readCandidates('candidates' in body ? body.candidates : null);

  if (budget <= 0) {
    return NextResponse.json({ error: 'Вкажи місячний бюджет.' }, { status: 400 });
  }

  if (!candidates.trim()) {
    return NextResponse.json({ error: 'Додай список тікерів.' }, { status: 400 });
  }

  try {
    const result = await filterMonthlyCandidates(candidates, budget);

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося проаналізувати список акцій.' },
      { status: 502 }
    );
  }
}
