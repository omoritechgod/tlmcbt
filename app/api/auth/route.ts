import { NextRequest, NextResponse } from 'next/server';
import { createStudentSession, clearStudentSession } from '@/lib/auth';
import { getOrCreateStudent } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const student = await getOrCreateStudent(name, email, phone);
    await createStudentSession(student.email, student.name);
    return NextResponse.json({ ok: true, name: student.name, email: student.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  clearStudentSession();
  return NextResponse.json({ ok: true });
}
