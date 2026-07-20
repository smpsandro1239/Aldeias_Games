import { NextResponse } from 'next/server';
import { ensureSeeded, getSeedStatus } from '@/lib/db-init';

export async function GET() {
  try {
    const status = await getSeedStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ seeded: false, error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await ensureSeeded();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ seeded: false, error: String(error) }, { status: 500 });
  }
}
