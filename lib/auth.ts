import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-me-in-production-please'
);

const ADMIN_COOKIE = 'tlm_admin';
const STUDENT_COOKIE = 'tlm_student';

// ---------- ADMIN ----------

export async function createAdminSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function isAdminAuthed(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || 'tlm-admin-2026';
  return input === expected;
}

// ---------- STUDENT ----------

export async function createStudentSession(email: string, name: string) {
  const token = await new SignJWT({ role: 'student', email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  cookies().set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getStudentSession(): Promise<{ email: string; name: string } | null> {
  const token = cookies().get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'student') return null;
    return { email: payload.email as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export function clearStudentSession() {
  cookies().delete(STUDENT_COOKIE);
}
