import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createAdminSession, clearAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
