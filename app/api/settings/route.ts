import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, getDeadline } from '@/lib/db';
import { isAdminAuthed } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    deadline: (await getDeadline()).toISOString(),
    is_open: (await getSetting('is_open')) === '1',
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { deadline, is_open } = await req.json();
  if (deadline) {
    const parsed = new Date(deadline);
    if (isNaN(parsed.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    await setSetting('deadline', parsed.toISOString());
  }
  if (typeof is_open === 'boolean') {
    await setSetting('is_open', is_open ? '1' : '0');
  }
  return NextResponse.json({ ok: true });
}
